import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import User from "@/models/User";
import TeamMember from "@/models/TeamMember";
import type { TaskStatus, TaskPriority } from "@/models/Task";
import { createNotification } from "@/lib/notify";

const VALID_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
  "ARCHIVED",
];
const VALID_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const { taskId } = await params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    await dbConnect();
    const task = await Task.findById(taskId)
      .populate("clientId", "name businessName")
      .populate("assignedTo", "name email")
      .lean();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(task)));
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const { taskId } = await params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    await dbConnect();

    const existing = await Task.findById(taskId);
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const oldAssignedTo = existing.assignedTo
      ? existing.assignedTo.toString()
      : null;

    const set: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status as TaskStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
          },
          { status: 400 },
        );
      }
      set.status = body.status;
    }

    if (body.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(body.priority as TaskPriority)) {
        return NextResponse.json(
          {
            error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`,
          },
          { status: 400 },
        );
      }
      set.priority = body.priority;
    }

    if (body.title !== undefined && typeof body.title === "string") {
      const t = body.title.trim();
      if (t) set.title = t;
    }

    if (body.description !== undefined) {
      set.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : undefined;
    }

    if (body.assignedTo !== undefined) {
      if (body.assignedTo === null || body.assignedTo === "") {
        set.assignedTo = null;
      } else if (
        typeof body.assignedTo === "string" &&
        mongoose.Types.ObjectId.isValid(body.assignedTo)
      ) {
        set.assignedTo = new mongoose.Types.ObjectId(body.assignedTo);
      }
    }

    if (body.deadline !== undefined) {
      if (body.deadline === null || body.deadline === "") {
        set.deadline = undefined;
      } else if (typeof body.deadline === "string") {
        const d = new Date(body.deadline);
        if (!Number.isNaN(d.getTime())) set.deadline = d;
      }
    }

    if (Object.keys(set).length === 0) {
      const unchanged = await Task.findById(taskId)
        .populate("clientId", "name businessName")
        .populate("assignedTo", "name email")
        .lean();
      return NextResponse.json(JSON.parse(JSON.stringify(unchanged)));
    }

    const updated = await Task.findByIdAndUpdate(
      taskId,
      { $set: set },
      { new: true },
    )
      .populate("clientId", "name businessName")
      .populate("assignedTo", "name email")
      .lean();

    // Notify newly assigned user if assignedTo changed to a new (non-null) value
    const newAssignedTo = set.assignedTo ? set.assignedTo.toString() : null;
    if (newAssignedTo && newAssignedTo !== oldAssignedTo) {
      try {
        let user = await User.findById(newAssignedTo).lean();
        if (!user) {
          const member = await TeamMember.findById(newAssignedTo).lean();
          if (member?.userId) {
            user = await User.findById(member.userId).lean();
          }
        }
        if (user && updated) {
          const taskTitle = (updated as { title?: string }).title ?? "";
          await createNotification({
            userId: (user as { _id: { toString(): string } })._id.toString(),
            type: "TASK_ASSIGNED",
            title: "Task assigned to you",
            message: `You have been assigned: "${taskTitle}"`,
            href: "/dashboard/tasks",
          });
        }
      } catch (notifyErr) {
        console.error("Error sending task assignment notification:", notifyErr);
      }
    }

    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const { taskId } = await params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    await dbConnect();
    const archived = await Task.findByIdAndUpdate(
      taskId,
      { $set: { status: "ARCHIVED" } },
      { new: true },
    )
      .populate("clientId", "name businessName")
      .populate("assignedTo", "name email")
      .lean();

    if (!archived) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(archived)));
  } catch (error) {
    console.error("Error archiving task:", error);
    return NextResponse.json(
      { error: "Failed to archive task" },
      { status: 500 },
    );
  }
}
