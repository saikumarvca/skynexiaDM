import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewDraft from '@/models/ReviewDraft';
import { logActivity } from '@/lib/review-activity';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const performedBy = body.performedBy ?? 'system';

    const original = await ReviewDraft.findById(id);
    if (!original) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const copy = new ReviewDraft({
      subject: original.subject + ' (Copy)',
      reviewText: original.reviewText,
      clientId: original.clientId,
      clientName: original.clientName,
      category: original.category,
      language: original.language,
      suggestedRating: original.suggestedRating,
      tone: original.tone,
      reusable: original.reusable,
      status: 'Available',
      createdBy: performedBy,
      notes: original.notes,
    });
    await copy.save();

    const populated = await ReviewDraft.findById(copy._id).populate(
      'clientId',
      'name businessName'
    );

    await logActivity({
      entityType: 'DRAFT',
      entityId: copy._id.toString(),
      action: 'DUPLICATE',
      oldValue: { sourceId: id },
      newValue: populated?.toObject(),
      performedBy,
    });

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('Error duplicating review draft:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate review draft' },
      { status: 500 }
    );
  }
}
