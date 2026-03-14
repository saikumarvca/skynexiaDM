import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewAllocation from '@/models/ReviewAllocation';
import ReviewDraft from '@/models/ReviewDraft';
import PostedReview from '@/models/PostedReview';
import { logActivity } from '@/lib/review-activity';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const {
      postedByName,
      platform,
      reviewLink,
      proofUrl,
      postedDate,
      markedUsedBy,
      remarks,
      performedBy = 'system',
    } = body;

    if (!postedByName || !postedByName.trim()) {
      return NextResponse.json(
        { error: 'Posted by name (customer name) is required' },
        { status: 400 }
      );
    }
    if (!platform || !platform.trim()) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }
    if (!reviewLink || !reviewLink.trim()) {
      return NextResponse.json({ error: 'Review link is required' }, { status: 400 });
    }
    if (!postedDate) {
      return NextResponse.json({ error: 'Posted date is required' }, { status: 400 });
    }

    const existing = await ReviewAllocation.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
    }

    let postedReview = await PostedReview.findOne({ allocationId: id });
    if (!postedReview) {
      postedReview = new PostedReview({
        allocationId: id,
        draftId: existing.draftId,
        postedByName: postedByName.trim(),
        platform: platform.trim(),
        reviewLink: reviewLink.trim(),
        proofUrl: proofUrl?.trim() || undefined,
        postedDate: new Date(postedDate),
        markedUsedBy: markedUsedBy || performedBy,
        remarks: remarks?.trim(),
      });
      await postedReview.save();
    }

    const now = new Date();
    await ReviewAllocation.findByIdAndUpdate(id, {
      allocationStatus: 'Used',
      postedDate: postedReview.postedDate,
      usedDate: now,
      updatedAt: now,
    });

    await ReviewDraft.findByIdAndUpdate(existing.draftId, {
      status: 'Used',
      updatedAt: now,
    });

    await logActivity({
      entityType: 'POSTED_REVIEW',
      entityId: postedReview._id.toString(),
      action: 'MARK_USED',
      newValue: { usedDate: now },
      performedBy: markedUsedBy || performedBy,
    });

    await logActivity({
      entityType: 'ALLOCATION',
      entityId: id,
      action: 'MARK_USED',
      newValue: { allocationStatus: 'Used', usedDate: now },
      performedBy: markedUsedBy || performedBy,
    });

    const allocation = await ReviewAllocation.findById(id).populate(
      'draftId',
      'subject reviewText clientName'
    );

    return NextResponse.json({
      allocation,
      postedReview: await PostedReview.findById(postedReview._id),
    });
  } catch (error) {
    console.error('Error marking allocation as used:', error);
    return NextResponse.json(
      { error: 'Failed to mark as used' },
      { status: 500 }
    );
  }
}
