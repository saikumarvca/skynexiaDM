import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import TeamRole from '@/models/TeamRole';
import { parseWithSchema, apiError } from '@/lib/api/validation';
import { teamMemberCreateSchema } from '@/lib/api/schemas';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const roleId = searchParams.get('roleId');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

    const query: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (roleId) query.roleId = roleId;
    if (status && status !== 'ALL') query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const sortField =
      sortBy === 'joinedAt' || sortBy === 'createdAt'
        ? sortBy
        : sortBy === 'role'
          ? 'roleName'
          : sortBy;

    const [items, total] = await Promise.all([
      TeamMember.find(query)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('roleId', 'roleName permissions')
        .lean(),
      TeamMember.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const parsed = await parseWithSchema(request, teamMemberCreateSchema);
    if (!parsed.ok) return parsed.response;
    const { name, email, phone, roleId, department, notes } = parsed.data;

    let roleName = '';
    if (roleId) {
      const role = await TeamRole.findById(roleId);
      if (role) roleName = role.roleName;
    }

    const member = new TeamMember({
      name,
      email,
      phone: phone || undefined,
      roleId: roleId || undefined,
      roleName: roleName || undefined,
      department: department || undefined,
      notes: notes || undefined,
      assignedClientIds: [],
      status: 'Active',
    });
    await member.save();

    const populated = await TeamMember.findById(member._id)
      .populate('roleId', 'roleName permissions')
      .lean();
    return NextResponse.json(populated, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating team member:', error);
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code: number | string }).code
        : null;
    if (code === 11000 || code === '11000') {
      return apiError(409, 'Email already in use', 'DUPLICATE_KEY');
    }
    const msg = error instanceof Error ? error.message : 'Failed to create team member';
    return apiError(500, msg, 'INTERNAL_ERROR');
  }
}
