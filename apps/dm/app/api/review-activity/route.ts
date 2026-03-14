import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewActivityLog from '@/models/ReviewActivityLog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const validTypes = ['DRAFT', 'ALLOCATION', 'POSTED_REVIEW'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'entityType must be DRAFT, ALLOCATION, or POSTED_REVIEW' },
        { status: 400 }
      );
    }

    const activity = await ReviewActivityLog.find({
      entityType,
      entityId,
    }).sort({ performedAt: -1 });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching review activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review activity' },
      { status: 500 }
    );
  }
}
