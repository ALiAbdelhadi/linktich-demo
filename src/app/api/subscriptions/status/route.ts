import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { SubscriptionService } from '@/services/subscriptionService';
import { errorMessage, errorText } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || (session.role !== 'CENTER' && session.role !== 'TEACHER')) {
      return NextResponse.json(
        { success: false, error: errorMessage('centersAndTeachersOnly') },
        { status: 401 }
      );
    }

    const status = await SubscriptionService.checkSubscriptionStatus(
      session.userId,
      session.role as 'CENTER' | 'TEACHER'
    );

    return NextResponse.json({ success: true, data: status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 500 });
  }
}
