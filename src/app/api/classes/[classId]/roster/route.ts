import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { OperationsService } from '@/services/operationsService';
import { errorMessage, errorText } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CENTER' && session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('unauthorized') }, { status: 401 });
    }

    const { classId } = params;
    const { searchParams } = new URL(req.url);
    const sessionDate = searchParams.get('date') || undefined;

    const data = await OperationsService.getClassRosterWithAnalytics(classId, sessionDate);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 500 });
  }
}
