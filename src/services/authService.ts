// ==============================================================================
// Linktich Authentication & RBAC Service
// Handles registration with role-specific profile generation and credential login
// ==============================================================================

import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  comparePassword,
  signSessionToken,
  getDashboardRoute,
  AuthSessionPayload,
} from '@/lib/auth';
import { SignUpSchema, LoginSchema } from '@/lib/validations/schema';
import { z } from 'zod';
import { UserRole, SubscriptionStatus, SubscriptionPlan } from '@prisma/client';
import { AppError } from '@/lib/errors';

export class AuthService {
  /**
   * Register a new user and initialize role-specific profile in a transaction
   */
  static async register(input: z.infer<typeof SignUpSchema>) {
    const validated = SignUpSchema.parse(input);

    // 1. Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('emailTaken');
    }

    // 2. Hash password
    const passwordHash = await hashPassword(validated.password);

    // 3. Atomically create User and role-specific profile
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validated.name,
          email: validated.email.toLowerCase(),
          phone: validated.phone,
          passwordHash,
          role: validated.role as UserRole,
        },
      });

      let centerId: string | undefined;
      let teacherId: string | undefined;

      if (validated.role === 'CENTER') {
        const center = await tx.center.create({
          data: {
            ownerId: user.id,
            name: validated.centerName || `${validated.name}'s Center`,
            location: validated.centerLocation || 'Egypt',
            phone: validated.phone,
            subscriptionStatus: SubscriptionStatus.TRIALING,
            subscriptionPlan: SubscriptionPlan.FREE_TRIAL,
          },
        });
        centerId = center.id;
      } else if (validated.role === 'TEACHER') {
        const teacher = await tx.teacher.create({
          data: {
            userId: user.id,
            subject: validated.subject || 'General Education',
            bio: validated.bio || null,
            subscriptionStatus: SubscriptionStatus.TRIALING,
            subscriptionPlan: SubscriptionPlan.FREE_TRIAL,
          },
        });
        teacherId = teacher.id;
      }

      return { user, centerId, teacherId };
    });

    // 4. Generate JWT session token
    const sessionPayload: AuthSessionPayload = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      phone: result.user.phone,
      centerId: result.centerId,
      teacherId: result.teacherId,
    };

    const token = await signSessionToken(sessionPayload);
    const redirectTo = getDashboardRoute(result.user.role);

    return {
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      redirectTo,
    };
  }

  /**
   * Authenticate user credentials and return session token with role redirect
   */
  static async login(input: z.infer<typeof LoginSchema>) {
    const validated = LoginSchema.parse(input);

    // 1. Find user by email with related role entities
    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: {
        centerProfile: { select: { id: true } },
        teacherProfile: { select: { id: true } },
      },
    });

    if (!user) {
      throw new AppError('invalidCredentials');
    }

    // 2. Validate password
    const isPasswordValid = await comparePassword(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('invalidCredentials');
    }

    // 3. Generate session payload and JWT token
    const sessionPayload: AuthSessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      centerId: user.centerProfile?.id,
      teacherId: user.teacherProfile?.id,
    };

    const token = await signSessionToken(sessionPayload);
    const redirectTo = getDashboardRoute(user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectTo,
    };
  }
}
