import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScheduledPost from '@/models/ScheduledPost';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (platform) query.platform = platform;
    if (status) query.status = status;

    const posts = await ScheduledPost.find(query).sort({ publishDate: 1 });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const post = new ScheduledPost(body);
    await post.save();
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled post' },
      { status: 500 }
    );
  }
}

