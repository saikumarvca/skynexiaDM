import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import TeamAssignment from "@/models/TeamAssignment";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;
    const assignment = await TeamAssignment.findOne({
      _id: id,
      isDeleted: { $ne: true },
    }).lean();

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching team assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch team assignment" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const assignment = await TeamAssignment.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    const allowed = [
      "title",
      "description",
      "assignmentType",
      "sourceModule",
      "referenceId",
      "assignedToUserId",
      "assignedToUserName",
      "status",
      "priority",
      "dueDate",
      "notes",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) assignment.set(key, body[key]);
    }
    if (body.status === "Completed") {
      assignment.completedAt = new Date();
    }
    if (body.status && body.status !== "Completed") {
      assignment.completedAt = undefined;
    }
    await assignment.save();

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating team assignment:", error);
    return NextResponse.json(
      { error: "Failed to update team assignment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();
    const { id } = await params;

    const assignment = await TeamAssignment.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    assignment.status = "Cancelled";
    assignment.isDeleted = true;
    assignment.deletedAt = new Date();
    await assignment.save();

    return NextResponse.json({ message: "Assignment cancelled and archived" });
  } catch (error) {
    console.error("Error cancelling team assignment:", error);
    return NextResponse.json(
      { error: "Failed to cancel team assignment" },
      { status: 500 },
    );
  }
}
