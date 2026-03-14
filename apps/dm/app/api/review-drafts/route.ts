import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewDraft from '@/models/ReviewDraft';
import { logActivity } from '@/lib/review-activity';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const reusable = searchParams.get('reusable');
    const search = searchParams.get('search');
    const createdBy = searchParams.get('createdBy');

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (status && status !== 'ALL') query.status = status;
    if (category) query.category = category;
    if (language) query.language = language;
    if (reusable === 'true') query.reusable = true;
    if (reusable === 'false') query.reusable = false;
    if (createdBy) query.createdBy = createdBy;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { reviewText: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const drafts = await ReviewDraft.find(query)
      .populate('clientId', 'name businessName')
      .sort({ createdAt: -1 });

    return NextResponse.json(drafts);
  } catch (error) {
    console.error('Error fetching review drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review drafts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { createdBy = 'system', ...rest } = body;
    const draft = new ReviewDraft({ ...rest, createdBy });
    await draft.save();

    const populated = await ReviewDraft.findById(draft._id).populate(
      'clientId',
      'name businessName'
    );

    await logActivity({
      entityType: 'DRAFT',
      entityId: draft._id.toString(),
      action: 'CREATE',
      newValue: populated?.toObject(),
      performedBy: createdBy,
    });

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('Error creating review draft:', error);
    return NextResponse.json(
      { error: 'Failed to create review draft' },
      { status: 500 }
    );
  }
}
