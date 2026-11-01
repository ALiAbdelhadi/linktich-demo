// ==============================================================================
// Linktich Daily Operations & Analytics Service
// Handles session attendance marking, student payment tracking,
// and center-teacher revenue split calculations (EGP)
// ==============================================================================

import { prisma } from '@/lib/prisma';
import {
  RevenueSplitAnalytics,
  DashboardAnalyticsOverview,
  SessionAttendanceStatus,
} from '@/types/database';
import { AppError } from '@/lib/errors';

export class OperationsService {
  /**
   * Fetch a class's student roster, attendance records for a specific date, and live revenue split
   */
  static async getClassRosterWithAnalytics(classId: string, sessionDateStr?: string) {
    const sessionDate = sessionDateStr ? new Date(sessionDateStr) : new Date();
    // Normalize to date (YYYY-MM-DD 00:00:00)
    sessionDate.setHours(0, 0, 0, 0);

    // 1. Fetch Class with Center, Teacher, and their relation
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        center: { select: { id: true, name: true, location: true } },
        teacher: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        enrollments: {
          include: {
            student: { select: { id: true, name: true, email: true, phone: true } },
            sessionAttendances: {
              where: {
                sessionDate: sessionDate,
              },
            },
          },
          orderBy: { student: { name: 'asc' } },
        },
      },
    });

    if (!targetClass) {
      throw new AppError('classNotFound');
    }

    // 2. Fetch Center-Teacher agreement commission split
    const relation = await prisma.centerTeacherRelation.findUnique({
      where: {
        centerId_teacherId: {
          centerId: targetClass.centerId,
          teacherId: targetClass.teacherId,
        },
      },
      select: { commissionRate: true },
    });

    const pricePerStudent = Number(targetClass.price);
    const totalStudents = targetClass.enrollments.length;

    // Check payments for this session or overall enrollment
    let paidStudentsCount = 0;
    let presentStudentsCount = 0;

    const roster = targetClass.enrollments.map((enr) => {
      const attendance = enr.sessionAttendances[0];
      const isPaidForSession = attendance ? attendance.isPaid : enr.paymentStatus === 'PAID';
      const status: SessionAttendanceStatus = attendance
        ? (attendance.status as SessionAttendanceStatus)
        : 'PRESENT';

      if (isPaidForSession) paidStudentsCount++;
      if (status === 'PRESENT') presentStudentsCount++;

      return {
        enrollmentId: enr.id,
        studentId: enr.student.id,
        studentName: enr.student.name,
        studentEmail: enr.student.email,
        studentPhone: enr.student.phone,
        enrolledAt: enr.enrolledAt,
        masterPaymentStatus: enr.paymentStatus,
        masterAttendanceStatus: enr.attendanceStatus,
        sessionStatus: status,
        isPaidForSession,
        amountPaid: attendance?.amountPaid ? Number(attendance.amountPaid) : pricePerStudent,
      };
    });

    const unpaidStudentsCount = totalStudents - paidStudentsCount;
    const grossRevenue = paidStudentsCount * pricePerStudent;

    // Center commission percentage (default to 20% if not configured)
    const centerCommissionRate = relation?.commissionRate
      ? Number(relation.commissionRate)
      : 20;
    const teacherCommissionRate = 100 - centerCommissionRate;

    const centerShareRevenue = (grossRevenue * centerCommissionRate) / 100;
    const teacherShareRevenue = (grossRevenue * teacherCommissionRate) / 100;
    const uncollectedRevenue = unpaidStudentsCount * pricePerStudent;

    const revenueSplit: RevenueSplitAnalytics = {
      classId: targetClass.id,
      className: targetClass.name,
      teacherName: targetClass.teacher.user.name,
      centerName: targetClass.center.name,
      totalStudents,
      paidStudents: paidStudentsCount,
      unpaidStudents: unpaidStudentsCount,
      pricePerStudent,
      billingCycle: targetClass.billingCycle,
      grossRevenue,
      centerCommissionRate,
      teacherCommissionRate,
      centerShareRevenue,
      teacherShareRevenue,
      uncollectedRevenue,
    };

    return {
      classDetails: {
        id: targetClass.id,
        name: targetClass.name,
        schedule: targetClass.schedule,
        price: pricePerStudent,
        billingCycle: targetClass.billingCycle,
        center: targetClass.center,
        teacher: {
          id: targetClass.teacher.id,
          name: targetClass.teacher.user.name,
          phone: targetClass.teacher.user.phone,
          subject: targetClass.teacher.subject,
        },
      },
      sessionDate: sessionDate.toISOString().split('T')[0],
      attendanceRate: totalStudents > 0 ? Math.round((presentStudentsCount / totalStudents) * 100) : 0,
      roster,
      revenueSplit,
    };
  }

  /**
   * Save session attendance & payments for a class
   */
  static async recordAttendanceBatch(params: {
    classId: string;
    sessionDateStr: string;
    records: Array<{
      studentId: string;
      enrollmentId: string;
      status: SessionAttendanceStatus;
      isPaid: boolean;
      amountPaid?: number;
      notes?: string;
    }>;
  }) {
    const { classId, sessionDateStr, records } = params;
    const sessionDate = new Date(sessionDateStr);
    sessionDate.setHours(0, 0, 0, 0);

    return await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        // 1. Upsert Session Attendance record
        await tx.sessionAttendance.upsert({
          where: {
            enrollmentId_sessionDate: {
              enrollmentId: rec.enrollmentId,
              sessionDate,
            },
          },
          update: {
            status: rec.status,
            isPaid: rec.isPaid,
            amountPaid: rec.amountPaid !== undefined ? rec.amountPaid : null,
            notes: rec.notes || null,
          },
          create: {
            enrollmentId: rec.enrollmentId,
            classId,
            studentId: rec.studentId,
            sessionDate,
            status: rec.status,
            isPaid: rec.isPaid,
            amountPaid: rec.amountPaid !== undefined ? rec.amountPaid : null,
            notes: rec.notes || null,
          },
        });

        // 2. Synchronize master Enrollment payment & attendance status
        await tx.enrollment.update({
          where: { id: rec.enrollmentId },
          data: {
            paymentStatus: rec.isPaid ? 'PAID' : 'PENDING',
            attendanceStatus: rec.status === 'PRESENT' ? 'REGULAR' : 'AT_RISK',
          },
        });
      }

      return { success: true, updatedCount: records.length };
    });
  }

  /**
   * Generate Dashboard Overview Analytics for Center or Teacher
   */
  static async getDashboardAnalytics(
    userId: string,
    role: 'CENTER' | 'TEACHER'
  ): Promise<DashboardAnalyticsOverview> {
    let classes: any[] = [];

    if (role === 'CENTER') {
      const center = await prisma.center.findUnique({
        where: { ownerId: userId },
      });
      if (!center) {
        throw new AppError('centerNotFound');
      }

      classes = await prisma.class.findMany({
        where: { centerId: center.id, isActive: true },
        include: {
          center: { select: { name: true } },
          teacher: {
            include: { user: { select: { name: true } } },
          },
          enrollments: {
            select: { id: true, studentId: true, paymentStatus: true, attendanceStatus: true },
          },
        },
      });
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher) {
        throw new AppError('teacherNotFound');
      }

      classes = await prisma.class.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          center: { select: { name: true } },
          teacher: {
            include: { user: { select: { name: true } } },
          },
          enrollments: {
            select: { id: true, studentId: true, paymentStatus: true, attendanceStatus: true },
          },
        },
      });
    }

    // Fetch relations for commission calculations
    const centerTeacherPairs = classes.map((c) => ({
      centerId: c.centerId,
      teacherId: c.teacherId,
    }));

    const relations = await prisma.centerTeacherRelation.findMany({
      where: {
        OR: centerTeacherPairs.map((pair) => ({
          centerId: pair.centerId,
          teacherId: pair.teacherId,
        })),
      },
      select: { centerId: true, teacherId: true, commissionRate: true },
    });

    const relationMap = new Map<string, number>();
    relations.forEach((r) => {
      relationMap.set(`${r.centerId}_${r.teacherId}`, r.commissionRate ? Number(r.commissionRate) : 20);
    });

    const uniqueStudents = new Set<string>();
    let totalGrossRevenue = 0;
    let centerShareTotal = 0;
    let teacherShareTotal = 0;
    let regularAttendanceCount = 0;
    let totalEnrollmentsCount = 0;

    const classBreakdowns: RevenueSplitAnalytics[] = classes.map((c) => {
      const price = Number(c.price);
      const totalStudents = c.enrollments.length;
      let paidCount = 0;

      c.enrollments.forEach((e: any) => {
        uniqueStudents.add(e.studentId);
        totalEnrollmentsCount++;
        if (e.paymentStatus === 'PAID') paidCount++;
        if (e.attendanceStatus === 'REGULAR' || e.attendanceStatus === 'REGISTERED') {
          regularAttendanceCount++;
        }
      });

      const unpaidCount = totalStudents - paidCount;
      const grossRevenue = paidCount * price;
      const centerRate = relationMap.get(`${c.centerId}_${c.teacherId}`) ?? 20;
      const teacherRate = 100 - centerRate;

      const centerShare = (grossRevenue * centerRate) / 100;
      const teacherShare = (grossRevenue * teacherRate) / 100;
      const uncollected = unpaidCount * price;

      totalGrossRevenue += grossRevenue;
      centerShareTotal += centerShare;
      teacherShareTotal += teacherShare;

      return {
        classId: c.id,
        className: c.name,
        teacherName: c.teacher.user.name,
        centerName: c.center.name,
        totalStudents,
        paidStudents: paidCount,
        unpaidStudents: unpaidCount,
        pricePerStudent: price,
        billingCycle: c.billingCycle,
        grossRevenue,
        centerCommissionRate: centerRate,
        teacherCommissionRate: teacherRate,
        centerShareRevenue: centerShare,
        teacherShareRevenue: teacherShare,
        uncollectedRevenue: uncollected,
      };
    });

    const averageAttendanceRate =
      totalEnrollmentsCount > 0
        ? Math.round((regularAttendanceCount / totalEnrollmentsCount) * 100)
        : 95;

    return {
      totalActiveStudents: uniqueStudents.size,
      totalActiveClasses: classes.length,
      totalMonthlyRevenue: totalGrossRevenue,
      centerShareTotal,
      teacherShareTotal,
      averageAttendanceRate,
      classBreakdowns,
    };
  }
}
