import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewAllocation from '@/models/ReviewAllocation';
import ReviewDraft from '@/models/ReviewDraft';
import { logActivity } from '@/lib/review-activity';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { customerName, customerContact, platform, sentDate, performedBy = 'system' } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required before marking as shared' },
        { status: 400 }
      );
    }

    const existing = await ReviewAllocation.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
    }

    const update: Record<string, unknown> = {
      customerName: customerName.trim(),
      allocationStatus: 'Shared with Customer',
      updatedAt: new Date(),
    };
    if (customerContact) update.customerContact = customerContact;
    if (platform) update.platform = platform;
    if (sentDate) update.sentDate = new Date(sentDate);

    const allocation = await ReviewAllocation.findOneAndUpdate(
      { _id: id },
      update,
      { new: true }
    ).populate('draftId', 'subject reviewText clientName');

    await ReviewDraft.findByIdAndUpdate(existing.draftId, {
      status: 'Shared',
      updatedAt: new Date(),
    });

    await logActivity({
      entityType: 'ALLOCATION',
      entityId: id,
      action: 'MARK_SHARED',
      oldValue: existing.toObject(),
      newValue: allocation?.toObject(),
      performedBy,
    });

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error marking allocation as shared:', error);
    return NextResponse.json(
      { error: 'Failed to mark as shared' },
      { status: 500 }
    );
  }
}
