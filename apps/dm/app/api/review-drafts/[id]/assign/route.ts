import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewDraft from '@/models/ReviewDraft';
import ReviewAllocation from '@/models/ReviewAllocation';
import { logActivity } from '@/lib/review-activity';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id: draftId } = await params;
    const body = await request.json();
    const {
      assignedToUserId,
      assignedToUserName,
      assignedByUserId,
      assignedByUserName,
      customerName,
      customerContact,
      platform,
    } = body;

    if (!assignedToUserId || !assignedToUserName || !assignedByUserId || !assignedByUserName) {
      return NextResponse.json(
        { error: 'assignedToUserId, assignedToUserName, assignedByUserId, assignedByUserName are required' },
        { status: 400 }
      );
    }

    const draft = await ReviewDraft.findById(draftId);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (!draft.reusable && draft.status === 'Used') {
      return NextResponse.json(
        { error: 'This draft is not reusable and has already been used. Cannot assign.' },
        { status: 400 }
      );
    }

    const allocation = new ReviewAllocation({
      draftId,
      assignedToUserId,
      assignedToUserName,
      assignedByUserId,
      assignedByUserName,
      customerName: customerName || undefined,
      customerContact: customerContact || undefined,
      platform: platform || undefined,
      allocationStatus: 'Assigned',
    });
    await allocation.save();

    const newStatus = draft.status === 'Available' ? 'Allocated' : draft.status;
    await ReviewDraft.findByIdAndUpdate(draftId, {
      status: newStatus,
      updatedAt: new Date(),
    });

    const populated = await ReviewAllocation.findById(allocation._id).populate('draftId', 'subject reviewText clientName');

    await logActivity({
      entityType: 'ALLOCATION',
      entityId: allocation._id.toString(),
      action: 'CREATE',
      newValue: populated?.toObject(),
      performedBy: assignedByUserName,
    });

    await logActivity({
      entityType: 'DRAFT',
      entityId: draftId,
      action: 'ALLOCATE',
      oldValue: { status: draft.status },
      newValue: { status: newStatus },
      performedBy: assignedByUserName,
    });

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('Error assigning draft:', error);
    return NextResponse.json(
      { error: 'Failed to assign draft' },
      { status: 500 }
    );
  }
}
