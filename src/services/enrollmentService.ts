import { prisma } from '@/lib/prisma';
import { CreateEnrollmentSchema } from '@/lib/validations/schema';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

export class EnrollmentService {
  /**
   * Enroll a student into a class
   */
  static async enrollStudent(input: z.infer<typeof CreateEnrollmentSchema>) {
    const validated = CreateEnrollmentSchema.parse(input);

    // 1. Verify class exists and is active
    const targetClass = await prisma.class.findUnique({
      where: { id: validated.classId },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!targetClass || !targetClass.isActive) {
      throw new AppError('classClosed');
    }

    // 2. Check if student is already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: validated.studentId,
          classId: validated.classId,
        },
      },
    });

    if (existing) {
      throw new AppError('alreadyEnrolled');
    }

    // 3. Check capacity
    if (targetClass.capacity && targetClass._count.enrollments >= targetClass.capacity) {
      throw new AppError('classFull');
    }

    // 4. Create enrollment record
    return await prisma.enrollment.create({
      data: {
        studentId: validated.studentId,
        classId: validated.classId,
        paymentStatus: validated.paymentStatus || 'PENDING',
        attendanceStatus: validated.attendanceStatus || 'REGISTERED',
      },
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        class: {
          include: {
            center: { select: { id: true, name: true, location: true } },
            teacher: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all active enrollments for a given student
   */
  static async getStudentEnrollments(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            center: { select: { id: true, name: true, location: true, phone: true } },
            teacher: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => ({
      id: e.id,
      paymentStatus: e.paymentStatus,
      attendanceStatus: e.attendanceStatus,
      enrolledAt: e.enrolledAt,
      class: {
        id: e.class.id,
        name: e.class.name,
        schedule: e.class.schedule,
        price: Number(e.class.price),
        billingCycle: e.class.billingCycle,
        center: e.class.center,
        teacher: {
          id: e.class.teacher.id,
          subject: e.class.teacher.subject,
          name: e.class.teacher.user.name,
        },
      },
    }));
  }

  /**
   * Update student payment or attendance status
   */
  static async updateEnrollmentStatus(
    enrollmentId: string,
    data: {
      paymentStatus?: 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED' | 'EXEMPT';
      attendanceStatus?: 'REGISTERED' | 'REGULAR' | 'AT_RISK' | 'DROPPED';
    }
  ) {
    return await prisma.enrollment.update({
      where: { id: enrollmentId },
      data,
    });
  }
}
