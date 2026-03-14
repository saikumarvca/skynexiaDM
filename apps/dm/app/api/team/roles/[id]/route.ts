import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamRole from '@/models/TeamRole';
import TeamMember from '@/models/TeamMember';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const role = await TeamRole.findOne({
      _id: id,
      isDeleted: { $ne: true },
    }).lean();

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching team role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team role' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const role = await TeamRole.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const allowed = ['roleName', 'description', 'permissions'];
    for (const key of allowed) {
      if (body[key] !== undefined) role.set(key, body[key]);
    }
    await role.save();

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating team role:', error);
    return NextResponse.json(
      { error: 'Failed to update team role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const linkedMembers = await TeamMember.countDocuments({
      roleId: id,
      isDeleted: { $ne: true },
    });
    if (linkedMembers > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${linkedMembers} member(s) are assigned this role` },
        { status: 400 }
      );
    }

    const role = await TeamRole.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    role.isDeleted = true;
    role.deletedAt = new Date();
    await role.save();

    return NextResponse.json({ message: 'Role archived' });
  } catch (error) {
    console.error('Error archiving team role:', error);
    return NextResponse.json(
      { error: 'Failed to archive team role' },
      { status: 500 }
    );
  }
}
