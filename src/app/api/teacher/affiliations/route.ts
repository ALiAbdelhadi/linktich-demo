import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RelationStatus } from '@prisma/client';
import { errorMessage, errorText } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('unauthorized') }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: errorMessage('teacherNotFound') }, { status: 404 });
    }

    const affiliations = await prisma.centerTeacherRelation.findMany({
      where: { teacherId: teacher.id },
      include: {
        center: {
          select: { id: true, name: true, location: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: affiliations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('unauthorized') }, { status: 401 });
    }

    const body = await req.json();
    const { relationId, status } = body;

    if (!relationId || !status) {
      return NextResponse.json({ success: false, error: errorMessage('missingFields') }, { status: 400 });
    }

    const updated = await prisma.centerTeacherRelation.update({
      where: { id: relationId },
      data: { status: status as RelationStatus },
      include: {
        center: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 400 });
  }
}
