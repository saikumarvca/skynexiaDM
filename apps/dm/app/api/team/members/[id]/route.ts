import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import TeamRole from '@/models/TeamRole';
import { syncLoginUserFromTeamMember } from '@/lib/team-member-user-sync';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const member = await TeamMember.findOne({
      _id: id,
      isDeleted: { $ne: true },
    })
      .populate('roleId', 'roleName permissions')
      .lean();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
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
    const rawPassword = typeof body.password === 'string' ? body.password : '';
    const password =
      rawPassword.trim().length > 0 ? rawPassword : undefined;
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const member = await TeamMember.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const allowed = [
      'name',
      'email',
      'phone',
      'roleId',
      'department',
      'notes',
      'assignedClientIds',
      'assignedClientNamesSnapshot',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) member.set(key, body[key]);
    }
    if (body.roleId) {
      const role = await TeamRole.findById(body.roleId);
      if (role) member.roleName = role.roleName;
    }
    await member.save();

    try {
      await syncLoginUserFromTeamMember(
        member,
        password ? { password } : {}
      );
    } catch (syncErr: unknown) {
      const code =
        syncErr && typeof syncErr === 'object' && 'code' in syncErr
          ? (syncErr as { code: number | string }).code
          : null;
      if (code === 11000 || code === '11000') {
        return NextResponse.json(
          { error: 'A login account already exists for this email' },
          { status: 409 }
        );
      }
      throw syncErr;
    }

    const populated = await TeamMember.findById(member._id)
      .populate('roleId', 'roleName permissions')
      .lean();
    return NextResponse.json(populated);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
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

    const member = await TeamMember.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    member.isDeleted = true;
    member.deletedAt = new Date();
    member.status = 'Inactive';
    await member.save();

    return NextResponse.json({ message: 'Member archived' });
  } catch (error) {
    console.error('Error archiving team member:', error);
    return NextResponse.json(
      { error: 'Failed to archive team member' },
      { status: 500 }
    );
  }
}
