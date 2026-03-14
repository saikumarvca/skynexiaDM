import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

export async function GET(request: NextRequest) {
  try {
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
    await dbConnect();
    const body = await request.json();
    const task = new Task(body);
    if (body.assignedToUserId) task.assignedToUserId = body.assignedToUserId;
    if (body.assignedToName) task.assignedToName = body.assignedToName;
    await task.save();
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

