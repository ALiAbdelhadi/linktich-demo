// ==============================================================================
// Linktich SaaS Subscription Gate & Access Control
// Locks dashboards for expired or inactive Centers & Teachers,
// while keeping Student access 100% free.
// ==============================================================================

import { getSession } from '@/lib/auth';
import { SubscriptionService, SubscriptionGateResult } from '@/services/subscriptionService';
import { redirect } from 'next/navigation';
import { AppError } from '@/lib/errors';

/**
 * Server Component / Layout Gate:
 * Throws a Next.js redirect to /renew-subscription if subscription is expired or inactive.
 */
export async function requireActiveSubscription(): Promise<SubscriptionGateResult | null> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Students and Admins are exempt from the SaaS subscription gate
  if (session.role === 'STUDENT' || session.role === 'ADMIN') {
    return null;
  }

  const sub = await SubscriptionService.checkSubscriptionStatus(
    session.userId,
    session.role as 'CENTER' | 'TEACHER'
  );

  if (!sub || !sub.isSubscribed) {
    redirect('/renew-subscription');
  }

  return sub;
}

/**
 * API Route Gate Helper:
 * Verifies active subscription for API actions (e.g. creating classes, adding teachers).
 */
export async function assertActiveSubscription(userId: string, role: string) {
  if (role === 'STUDENT' || role === 'ADMIN') {
    return true;
  }

  if (role !== 'CENTER' && role !== 'TEACHER') {
    throw new Error('Invalid role for subscription check');
  }

  const sub = await SubscriptionService.checkSubscriptionStatus(
    userId,
    role as 'CENTER' | 'TEACHER'
  );

  if (!sub || !sub.isSubscribed) {
    throw new AppError('subscriptionInactive');
  }

  return true;
}
