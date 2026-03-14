import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewDraft from '@/models/ReviewDraft';
import { logActivity } from '@/lib/review-activity';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const draft = await ReviewDraft.findById(id).populate('clientId', 'name businessName');
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error fetching review draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review draft' },
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

    const existing = await ReviewDraft.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = await ReviewDraft.findOneAndUpdate(
      { _id: id },
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('clientId', 'name businessName');

    await logActivity({
      entityType: 'DRAFT',
      entityId: id,
      action: 'UPDATE',
      oldValue: existing.toObject(),
      newValue: draft?.toObject(),
      performedBy,
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error updating review draft:', error);
    return NextResponse.json(
      { error: 'Failed to update review draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const existing = await ReviewDraft.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    await ReviewDraft.findOneAndUpdate(
      { _id: id },
      { status: 'Archived', updatedAt: new Date() },
      { new: true }
    );

    await logActivity({
      entityType: 'DRAFT',
      entityId: id,
      action: 'ARCHIVE',
      oldValue: existing.toObject(),
      newValue: { status: 'Archived' },
      performedBy: 'system',
    });

    return NextResponse.json({ message: 'Draft archived successfully' });
  } catch (error) {
    console.error('Error archiving review draft:', error);
    return NextResponse.json(
      { error: 'Failed to archive review draft' },
      { status: 500 }
    );
  }
}
