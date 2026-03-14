import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExternalReview from '@/models/ExternalReview';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;

    const reviews = await ExternalReview.find(query).sort({ reviewDate: -1 });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching external reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch external reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const review = new ExternalReview(body);
    await review.save();
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating external review:', error);
    return NextResponse.json(
      { error: 'Failed to create external review' },
      { status: 500 }
    );
  }
}

