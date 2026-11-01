import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ClassService } from '@/services/classService';
import { CenterService } from '@/services/centerService';
import { errorMessage, errorText } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const isBrowse = searchParams.get('browse') === 'true';
    const search = searchParams.get('search') || undefined;
    let centerId = searchParams.get('centerId');

    // 1. Student / Public Catalog Browsing Mode
    if (isBrowse) {
      const classes = await ClassService.getAllBrowseableClasses({
        search,
        studentId: session?.role === 'STUDENT' ? session.userId : undefined,
      });
      return NextResponse.json({ success: true, data: classes });
    }

    // 2. Center-specific Mode
    if (!centerId && session?.role === 'CENTER') {
      const center = await CenterService.getCenterByOwnerId(session.userId);
      centerId = center?.id || null;
    }

    if (!centerId) {
      return NextResponse.json(
        { success: false, error: errorMessage('missingFields') },
        { status: 400 }
      );
    }

    const classes = await ClassService.getClassesByCenter(centerId);
    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CENTER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('centerOnly') }, { status: 401 });
    }

    let centerId = session.centerId;
    if (!centerId) {
      const center = await CenterService.getCenterByOwnerId(session.userId);
      if (!center) {
        return NextResponse.json({ success: false, error: errorMessage('centerNotFound') }, { status: 404 });
      }
      centerId = center.id;
    }

    const body = await req.json();

    const createdClass = await ClassService.createClass({
      centerId,
      teacherId: body.teacherId,
      name: body.name,
      schedule: body.schedule,
      price: Number(body.price),
      billingCycle: body.billingCycle || 'MONTHLY',
      capacity: body.capacity ? Number(body.capacity) : null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({ success: true, data: createdClass }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 400 });
  }
}
