import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FileAsset from '@/models/FileAsset';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    await dbConnect();
    const { fileId } = await params;
    await FileAsset.findByIdAndDelete(fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
