import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ContentItem from '@/models/ContentItem';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (platform) query.platform = platform;
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await ContentItem.find(query)
      .populate('clientId', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(200);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching content items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const item = new ContentItem(body);
    await item.save();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating content item:', error);
    return NextResponse.json(
      { error: 'Failed to create content item' },
      { status: 500 }
    );
  }
}

