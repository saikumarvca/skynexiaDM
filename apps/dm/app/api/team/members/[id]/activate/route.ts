import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const member = await TeamMember.findOne({ _id: id });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    member.status = 'Active';
    await member.save();

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error activating team member:', error);
    return NextResponse.json(
      { error: 'Failed to activate team member' },
      { status: 500 }
    );
  }
}
