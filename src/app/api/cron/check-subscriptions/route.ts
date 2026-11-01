import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/services/subscriptionService';

/**
 * Scheduled Cron Handler to detect ended subscriptions and mark them EXPIRED.
 * Can be triggered via Vercel Cron, external crontab, or GitHub Actions.
 */
export async function GET(req: NextRequest) {
  try {
    // Optional secret verification for production cron schedulers
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const result = await SubscriptionService.checkAndUpdateExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      message: 'Subscription expiration verification completed successfully.',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
