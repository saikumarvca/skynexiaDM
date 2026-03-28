import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/require-session-api';
import dbConnect from '@/lib/mongodb';
import SavedFilter from '@/models/SavedFilter';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;
    const filter = await SavedFilter.findById(id).lean();
    if (!filter) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(filter);
  } catch (error) {
    console.error('Error fetching saved filter:', error);
    return NextResponse.json({ error: 'Failed to fetch saved filter' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { name, filters } = body;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (filters !== undefined) update.filters = filters;

    const updated = await SavedFilter.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating saved filter:', error);
    return NextResponse.json({ error: 'Failed to update saved filter' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;
    const deleted = await SavedFilter.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved filter:', error);
    return NextResponse.json({ error: 'Failed to delete saved filter' }, { status: 500 });
  }
}
