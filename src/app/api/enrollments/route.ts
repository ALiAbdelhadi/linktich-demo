import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { EnrollmentService } from '@/services/enrollmentService';
import { errorMessage, errorText } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'STUDENT' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('studentOnly') }, { status: 401 });
    }

    const enrollments = await EnrollmentService.getStudentEnrollments(session.userId);
    return NextResponse.json({ success: true, data: enrollments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'STUDENT' && session.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: errorMessage('studentOnly') },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json({ success: false, error: errorMessage('missingFields') }, { status: 400 });
    }

    const enrollment = await EnrollmentService.enrollStudent({
      studentId: session.userId,
      classId,
      paymentStatus: 'PENDING',
      attendanceStatus: 'REGISTERED',
    });

    return NextResponse.json({ success: true, data: enrollment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 400 });
  }
}
