import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Keyword from '@/models/Keyword';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (search) {
      query.keyword = { $regex: search, $options: 'i' };
    }

    const keywords = await Keyword.find(query)
      .populate('clientId', 'name businessName')
      .sort({ difficulty: 1, searchVolume: -1 });
    return NextResponse.json(keywords);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const keyword = new Keyword(body);
    await keyword.save();
    return NextResponse.json(keyword, { status: 201 });
  } catch (error) {
    console.error('Error creating keyword:', error);
    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}

