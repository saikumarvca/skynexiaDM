import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewAllocation from '@/models/ReviewAllocation';
import { logActivity } from '@/lib/review-activity';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const allocation = await ReviewAllocation.findById(id).populate(
      'draftId',
      'subject reviewText clientId clientName'
    );
    if (!allocation) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
    }
    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error fetching review allocation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review allocation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const performedBy = body.performedBy ?? 'system';
    delete body.performedBy;

    const existing = await ReviewAllocation.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
    }

    const allocation = await ReviewAllocation.findOneAndUpdate(
      { _id: id },
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('draftId', 'subject reviewText clientName');

    await logActivity({
      entityType: 'ALLOCATION',
      entityId: id,
      action: 'UPDATE',
      oldValue: existing.toObject(),
      newValue: allocation?.toObject(),
      performedBy,
    });

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error updating review allocation:', error);
    return NextResponse.json(
      { error: 'Failed to update review allocation' },
      { status: 500 }
    );
  }
}
