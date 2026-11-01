import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/services/subscriptionService';
import { SubscriptionPlan } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Verify Paymob / Fawry HMAC signature here in production
    const { entityType, entityId, plan, planId, durationDays } = payload;

    const result = await SubscriptionService.activateSubscription({
      entityType,
      entityId,
      planId: (planId || plan) as SubscriptionPlan,
      durationDays: durationDays || 30,
      gateway: 'API_SIMULATED',
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
