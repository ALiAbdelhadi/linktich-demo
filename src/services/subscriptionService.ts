import { prisma } from '@/lib/prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { SAAS_PLANS } from '@/config/plans';

export interface SubscriptionGateResult {
  isSubscribed: boolean;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  currentPeriodEnd: Date | null;
  daysLeft: number;
  entityId: string;
  name: string;
}

export class SubscriptionService {
  /**
   * Check the real-time subscription status for a Center or Teacher
   */
  static async checkSubscriptionStatus(
    userId: string,
    role: 'CENTER' | 'TEACHER'
  ): Promise<SubscriptionGateResult | null> {
    const now = new Date();

    if (role === 'CENTER') {
      const center = await prisma.center.findUnique({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          subscriptionCurrentPeriodEnd: true,
        },
      });

      if (!center) return null;

      const isExpired =
        center.subscriptionCurrentPeriodEnd !== null &&
        center.subscriptionCurrentPeriodEnd <= now;

      // Subscription is considered active only if status is ACTIVE or TRIALING and not past period end
      const isSubscribed =
        (center.subscriptionStatus === SubscriptionStatus.ACTIVE ||
          center.subscriptionStatus === SubscriptionStatus.TRIALING) &&
        !isExpired;

      const daysLeft = center.subscriptionCurrentPeriodEnd
        ? Math.max(
            0,
            Math.ceil(
              (center.subscriptionCurrentPeriodEnd.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0;

      return {
        isSubscribed,
        status: isExpired ? SubscriptionStatus.EXPIRED : center.subscriptionStatus,
        plan: center.subscriptionPlan,
        currentPeriodEnd: center.subscriptionCurrentPeriodEnd,
        daysLeft,
        entityId: center.id,
        name: center.name,
      };
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        include: { user: { select: { name: true } } },
      });

      if (!teacher) return null;

      const isExpired =
        teacher.subscriptionCurrentPeriodEnd !== null &&
        teacher.subscriptionCurrentPeriodEnd <= now;

      const isSubscribed =
        (teacher.subscriptionStatus === SubscriptionStatus.ACTIVE ||
          teacher.subscriptionStatus === SubscriptionStatus.TRIALING) &&
        !isExpired;

      const daysLeft = teacher.subscriptionCurrentPeriodEnd
        ? Math.max(
            0,
            Math.ceil(
              (teacher.subscriptionCurrentPeriodEnd.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0;

      return {
        isSubscribed,
        status: isExpired ? SubscriptionStatus.EXPIRED : teacher.subscriptionStatus,
        plan: teacher.subscriptionPlan,
        currentPeriodEnd: teacher.subscriptionCurrentPeriodEnd,
        daysLeft,
        entityId: teacher.id,
        name: teacher.user.name,
      };
    }
  }

  /**
   * Process simulated payment gateway (Paymob / Fawry / Stripe)
   */
  static async processSubscriptionPayment(params: {
    userId: string;
    role: 'CENTER' | 'TEACHER';
    planId: SubscriptionPlan;
    paymentMethod: string;
    billingInterval: 'MONTHLY' | 'YEARLY';
  }) {
    const { userId, role, planId, paymentMethod, billingInterval } = params;

    // Validate plan
    const planConfig = SAAS_PLANS[planId];
    if (!planConfig) {
      throw new Error(`Plan ${planId} not found in SaaS catalog`);
    }

    if (planConfig.targetRole !== role) {
      throw new Error(`Plan ${planId} is not applicable for role ${role}`);
    }

    // Duration calculation: 30 days for Monthly, 365 days for Yearly
    const durationDays = billingInterval === 'YEARLY' ? 365 : 30;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Simulated Gateway Transaction ID (Paymob format)
    const simulatedTxnId = `PAYMOB_EGY_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    if (role === 'CENTER') {
      const center = await prisma.center.findUnique({
        where: { ownerId: userId },
      });

      if (!center) {
        throw new Error('Center record not found for user');
      }

      const updated = await prisma.center.update({
        where: { id: center.id },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionPlan: planId,
          subscriptionCurrentPeriodEnd: periodEnd,
        },
      });

      return {
        success: true,
        transactionId: simulatedTxnId,
        paymentMethod,
        amountEGP: planConfig.priceEGP,
        billingInterval,
        periodEnd,
        entity: updated,
      };
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher) {
        throw new Error('Teacher record not found for user');
      }

      const updated = await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionPlan: planId,
          subscriptionCurrentPeriodEnd: periodEnd,
        },
      });

      return {
        success: true,
        transactionId: simulatedTxnId,
        paymentMethod,
        amountEGP: planConfig.priceEGP,
        billingInterval,
        periodEnd,
        entity: updated,
      };
    }
  }

  /**
   * Activate or extend subscription upon verified webhook payment confirmation
   */
  static async activateSubscription(params: {
    entityType: 'CENTER' | 'TEACHER';
    entityId: string;
    planId: SubscriptionPlan;
    billingInterval?: 'MONTHLY' | 'YEARLY';
    durationDays?: number;
    transactionId?: string | number;
    gateway?: string;
  }) {
    const {
      entityType,
      entityId,
      planId,
      billingInterval,
      durationDays: customDuration,
      transactionId,
      gateway = 'PAYMOB',
    } = params;

    const daysToAdd =
      customDuration || (billingInterval === 'YEARLY' ? 365 : 30);
    const now = new Date();

    if (entityType === 'CENTER') {
      const center = await prisma.center.findFirst({
        where: {
          OR: [{ id: entityId }, { ownerId: entityId }],
        },
      });

      if (!center) {
        throw new Error(`Center not found with ID/ownerId: ${entityId}`);
      }

      // If existing subscription is still active and has future expiration, extend from that date
      const baseDate =
        center.subscriptionCurrentPeriodEnd &&
        center.subscriptionCurrentPeriodEnd > now
          ? center.subscriptionCurrentPeriodEnd
          : now;

      const newPeriodEnd = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      const updated = await prisma.center.update({
        where: { id: center.id },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionPlan: planId,
          subscriptionCurrentPeriodEnd: newPeriodEnd,
        },
      });

      return {
        success: true,
        entityType: 'CENTER',
        entityId: updated.id,
        name: updated.name,
        plan: planId,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionCurrentPeriodEnd: newPeriodEnd,
        transactionId,
        gateway,
      };
    } else {
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [{ id: entityId }, { userId: entityId }],
        },
        include: { user: { select: { name: true } } },
      });

      if (!teacher) {
        throw new Error(`Teacher not found with ID/userId: ${entityId}`);
      }

      const baseDate =
        teacher.subscriptionCurrentPeriodEnd &&
        teacher.subscriptionCurrentPeriodEnd > now
          ? teacher.subscriptionCurrentPeriodEnd
          : now;

      const newPeriodEnd = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      const updated = await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionPlan: planId,
          subscriptionCurrentPeriodEnd: newPeriodEnd,
        },
      });

      return {
        success: true,
        entityType: 'TEACHER',
        entityId: updated.id,
        name: teacher.user.name,
        plan: planId,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionCurrentPeriodEnd: newPeriodEnd,
        transactionId,
        gateway,
      };
    }
  }

  /**
   * Cron Job Helper: Checks all active subscriptions and updates expired ones
   */
  static async checkAndUpdateExpiredSubscriptions() {
    const now = new Date();

    // 1. Mark expired Centers
    const expiredCenters = await prisma.center.updateMany({
      where: {
        subscriptionStatus: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        subscriptionCurrentPeriodEnd: {
          lt: now,
          not: null,
        },
      },
      data: {
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      },
    });

    // 2. Mark expired Teachers
    const expiredTeachers = await prisma.teacher.updateMany({
      where: {
        subscriptionStatus: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        subscriptionCurrentPeriodEnd: {
          lt: now,
          not: null,
        },
      },
      data: {
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      },
    });

    return {
      timestamp: now.toISOString(),
      expiredCentersCount: expiredCenters.count,
      expiredTeachersCount: expiredTeachers.count,
    };
  }
}
