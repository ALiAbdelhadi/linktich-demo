import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { OperationsService } from '@/services/operationsService';
import { errorMessage, errorText } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CENTER' && session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('unauthorized') }, { status: 401 });
    }

    const role = session.role === 'ADMIN' ? 'CENTER' : session.role;
    const analytics = await OperationsService.getDashboardAnalytics(session.userId, role);

    return NextResponse.json({ success: true, data: analytics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 500 });
  }
}
