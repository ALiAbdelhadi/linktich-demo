import { prisma } from '@/lib/prisma';
import { CreateCenterSchema, LinkCenterTeacherSchema } from '@/lib/validations/schema';
import { z } from 'zod';
import { RelationStatus } from '@prisma/client';

export class CenterService {
  /**
   * Register a new educational center
   */
  static async createCenter(input: z.infer<typeof CreateCenterSchema>) {
    const validated = CreateCenterSchema.parse(input);

    return await prisma.center.create({
      data: {
        ownerId: validated.ownerId,
        name: validated.name,
        location: validated.location,
        phone: validated.phone,
        subscriptionPlan: validated.subscriptionPlan,
      },
      include: {
        owner: true,
      },
    });
  }

  /**
   * Get center by owner's user ID
   */
  static async getCenterByOwnerId(ownerId: string) {
    return await prisma.center.findUnique({
      where: { ownerId },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  /**
   * Associate or invite a teacher to a center
   */
  static async linkTeacher(input: z.infer<typeof LinkCenterTeacherSchema>) {
    const validated = LinkCenterTeacherSchema.parse(input);

    return await prisma.centerTeacherRelation.upsert({
      where: {
        centerId_teacherId: {
          centerId: validated.centerId,
          teacherId: validated.teacherId,
        },
      },
      update: {
        status: validated.status as RelationStatus,
        commissionRate: validated.commissionRate,
      },
      create: {
        centerId: validated.centerId,
        teacherId: validated.teacherId,
        status: validated.status as RelationStatus,
        commissionRate: validated.commissionRate,
      },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });
  }

  /**
   * Update status of an existing center-teacher relation (e.g. ACCEPT/REJECT)
   */
  static async updateRelationStatus(relationId: string, status: RelationStatus) {
    return await prisma.centerTeacherRelation.update({
      where: { id: relationId },
      data: { status },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });
  }

  /**
   * List all teacher relations for a given center (Active & Pending)
   */
  static async getAffiliatedTeachers(centerId: string) {
    return await prisma.centerTeacherRelation.findMany({
      where: { centerId },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List all registered teachers on the platform for centers to discover and send join requests
   */
  static async getDiscoverableTeachers(centerId: string) {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        centerRelations: {
          where: { centerId },
          select: { id: true, status: true, commissionRate: true },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    return teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.user.name,
      email: teacher.user.email,
      phone: teacher.user.phone,
      subject: teacher.subject,
      bio: teacher.bio,
      currentRelation: teacher.centerRelations[0] || null,
    }));
  }

  /**
   * Get center details by ID along with teachers and active classes
   */
  static async getCenterById(centerId: string) {
    return await prisma.center.findUnique({
      where: { id: centerId },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        teacherRelations: {
          include: {
            teacher: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
        classes: {
          where: { isActive: true },
          include: {
            teacher: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
