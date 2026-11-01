import { prisma } from '@/lib/prisma';
import { CreateClassSchema } from '@/lib/validations/schema';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@/lib/errors';

export class ClassService {
  /**
   * Create a new class/group in a center taught by a verified teacher
   */
  static async createClass(input: z.infer<typeof CreateClassSchema>) {
    const validated = CreateClassSchema.parse(input);

    // Verify teacher is actively affiliated with the center
    const relation = await prisma.centerTeacherRelation.findUnique({
      where: {
        centerId_teacherId: {
          centerId: validated.centerId,
          teacherId: validated.teacherId,
        },
      },
    });

    if (!relation || relation.status !== 'ACTIVE') {
      throw new AppError('teacherNotPartner');
    }

    return await prisma.class.create({
      data: {
        centerId: validated.centerId,
        teacherId: validated.teacherId,
        name: validated.name,
        schedule: validated.schedule as unknown as Prisma.InputJsonValue,
        price: validated.price,
        billingCycle: validated.billingCycle,
        capacity: validated.capacity,
        isActive: validated.isActive,
      },
      include: {
        center: true,
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });
  }

  /**
   * List all active classes for a specific center
   */
  static async getClassesByCenter(centerId: string) {
    return await prisma.class.findMany({
      where: { centerId, isActive: true },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Browse all active classes across all centers for students
   */
  static async getAllBrowseableClasses(options?: {
    search?: string;
    studentId?: string;
  }) {
    const { search, studentId } = options || {};

    const classes = await prisma.class.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { teacher: { subject: { contains: search, mode: 'insensitive' } } },
                { teacher: { user: { name: { contains: search, mode: 'insensitive' } } } },
                { center: { name: { contains: search, mode: 'insensitive' } } },
                { center: { location: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        center: {
          select: { id: true, name: true, location: true, phone: true },
        },
        teacher: {
          select: {
            id: true,
            subject: true,
            bio: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        enrollments: studentId
          ? {
              where: { studentId },
              select: { id: true, paymentStatus: true, attendanceStatus: true },
            }
          : false,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      price: Number(c.price),
      billingCycle: c.billingCycle,
      capacity: c.capacity,
      enrolledCount: c._count.enrollments,
      isFull: c.capacity ? c._count.enrollments >= c.capacity : false,
      isEnrolled: studentId ? (c.enrollments as any[])?.length > 0 : false,
      enrollmentDetails: studentId && (c.enrollments as any[])?.length > 0 ? (c.enrollments as any[])[0] : null,
      center: c.center,
      teacher: c.teacher,
    }));
  }
}
