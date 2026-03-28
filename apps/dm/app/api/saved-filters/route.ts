import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/require-session-api';
import dbConnect from '@/lib/mongodb';
import SavedFilter from '@/models/SavedFilter';

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    const query: Record<string, unknown> = {};
    if (entityType) query.entityType = entityType;

    const filters = await SavedFilter.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(filters);
  } catch (error) {
    console.error('Error fetching saved filters:', error);
    return NextResponse.json({ error: 'Failed to fetch saved filters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const body = await request.json();
    const { name, entityType, filters } = body;

    if (!name || !entityType || !filters) {
      return NextResponse.json(
        { error: 'name, entityType, and filters are required' },
        { status: 400 }
      );
    }

    const saved = new SavedFilter({ name, entityType, filters });
    await saved.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error creating saved filter:', error);
    return NextResponse.json({ error: 'Failed to create saved filter' }, { status: 500 });
  }
}
