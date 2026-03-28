import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FileAsset from '@/models/FileAsset';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category');

    const includeArchived = searchParams.get('includeArchived') === 'true';

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (category) query.category = category;
    if (!includeArchived) {
      query.isArchived = { $ne: true };
    }

    const files = await FileAsset.find(query).sort({ uploadedAt: -1 });
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const file = new FileAsset(body);
    await file.save();
    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error('Error creating file record:', error);
    return NextResponse.json(
      { error: 'Failed to create file record' },
      { status: 500 }
    );
  }
}

