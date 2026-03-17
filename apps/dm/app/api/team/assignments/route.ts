import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamAssignment from '@/models/TeamAssignment';
import { parseWithSchema, apiError } from '@/lib/api/validation';
import { teamAssignmentCreateSchema } from '@/lib/api/schemas';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedToUserId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (assignedTo) query.assignedToUserId = assignedTo;
    if (type && type !== 'ALL') query.assignmentType = type;
    if (status && status !== 'ALL') query.status = status;
    if (priority && priority !== 'ALL') query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { assignedToUserName: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } },
      ];
    }

    const sortField =
      sortBy === 'dueDate'
        ? 'dueDate'
        : sortBy === 'assignedTo'
          ? 'assignedToUserName'
          : sortBy === 'updatedAt' || sortBy === 'createdAt'
            ? sortBy
            : 'createdAt';

    const [items, total] = await Promise.all([
      TeamAssignment.find(query)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TeamAssignment.countDocuments(query),
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
    console.error('Error fetching team assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const parsed = await parseWithSchema(request, teamAssignmentCreateSchema);
    if (!parsed.ok) return parsed.response;
    const {
      title,
      description,
      assignmentType,
      sourceModule,
      referenceId,
      assignedToUserId,
      assignedToUserName,
      assignedByUserId,
      assignedByUserName,
      status,
      priority,
      dueDate,
      notes,
    } = parsed.data;

    const assignment = new TeamAssignment({
      title,
      description,
      assignmentType: assignmentType || 'other',
      sourceModule: sourceModule || undefined,
      referenceId,
      assignedToUserId,
      assignedToUserName,
      assignedByUserId,
      assignedByUserName,
      status: status || 'Pending',
      priority: priority || 'Medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
    });
    await assignment.save();

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error creating team assignment:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create team assignment';
    return apiError(500, msg, 'INTERNAL_ERROR');
  }
}
