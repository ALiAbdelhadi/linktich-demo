import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { OperationsService } from '@/services/operationsService';
import { errorMessage, errorText } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CENTER' && session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('unauthorized') }, { status: 401 });
    }

    const { classId } = params;
    const body = await req.json();
    const { sessionDate, records } = body;

    if (!sessionDate || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: errorMessage('missingFields') },
        { status: 400 }
      );
    }

    const result = await OperationsService.recordAttendanceBatch({
      classId,
      sessionDateStr: sessionDate,
      records,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 400 });
  }
}
