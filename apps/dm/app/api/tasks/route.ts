import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/require-session-api';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import TeamMember from '@/models/TeamMember';
import { parseWithSchema, apiError } from '@/lib/api/validation';
import { taskCreateSchema } from '@/lib/api/schemas';
import { createNotification } from '@/lib/notify';

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (assignedTo) {
      query.$or = [{ assignedTo: assignedTo }, { assignedToUserId: assignedTo }];
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('clientId', 'name businessName')
      .populate('assignedTo', 'name email')
      .sort({ status: 1, priority: -1, deadline: 1, createdAt: -1 });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const parsed = await parseWithSchema(request, taskCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const task = new Task({
      clientId: body.clientId,
      title: body.title,
      description: body.description,
      assignedToUserId: body.assignedToUserId,
      assignedToName: body.assignedToName,
      priority: body.priority,
      status: body.status,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    });
    await task.save();

    // Notify assigned user if assignedToUserId is set
    if (body.assignedToUserId) {
      try {
        let user = await User.findById(body.assignedToUserId).lean();
        if (!user) {
          const member = await TeamMember.findById(body.assignedToUserId).lean();
          if (member?.userId) {
            user = await User.findById(member.userId).lean();
          }
        }
        if (user) {
          await createNotification({
            userId: (user as { _id: { toString(): string } })._id.toString(),
            type: 'TASK_ASSIGNED',
            title: 'New task assigned to you',
            message: `You have been assigned: "${task.title}"`,
            href: '/dashboard/tasks',
          });
        }
      } catch (notifyErr) {
        console.error('Error sending task assignment notification:', notifyErr);
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create task';
    return apiError(500, msg, 'INTERNAL_ERROR');
  }
}

