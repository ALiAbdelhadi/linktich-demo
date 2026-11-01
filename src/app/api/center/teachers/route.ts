import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { CenterService } from '@/services/centerService';
import { RelationStatus } from '@prisma/client';
import { errorMessage, errorText } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CENTER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('unauthorized') }, { status: 401 });
    }

    // Find center ID for the logged in user
    let centerId = session.centerId;
    if (!centerId) {
      const center = await CenterService.getCenterByOwnerId(session.userId);
      if (!center) {
        return NextResponse.json({ success: false, error: errorMessage('centerNotFound') }, { status: 404 });
      }
      centerId = center.id;
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    if (mode === 'discover') {
      // Returns all platform teachers with their relationship to this center
      const discoverable = await CenterService.getDiscoverableTeachers(centerId);
      return NextResponse.json({ success: true, data: discoverable });
    }

    // Default: returns current center's affiliations (Active & Pending)
    const affiliated = await CenterService.getAffiliatedTeachers(centerId);
    return NextResponse.json({ success: true, data: affiliated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CENTER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('unauthorized') }, { status: 401 });
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
    const { teacherId, commissionRate, status } = body;

    if (!teacherId) {
      return NextResponse.json({ success: false, error: errorMessage('missingFields') }, { status: 400 });
    }

    const relation = await CenterService.linkTeacher({
      centerId,
      teacherId,
      commissionRate: commissionRate !== undefined ? Number(commissionRate) : 0,
      status: (status as any) || 'ACTIVE',
    });

    return NextResponse.json({ success: true, data: relation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CENTER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: errorMessage('unauthorized') }, { status: 401 });
    }

    const body = await req.json();
    const { relationId, status } = body;

    if (!relationId || !status) {
      return NextResponse.json(
        { success: false, error: errorMessage('missingFields') },
        { status: 400 }
      );
    }

    const updated = await CenterService.updateRelationStatus(
      relationId,
      status as RelationStatus
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errorText(error, 'generic') }, { status: 400 });
  }
}
