import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewRequest from "@/models/ReviewRequest";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const set: Record<string, unknown> = {};

    if (typeof body.reviewSubmitted === "boolean") {
      set.reviewSubmitted = body.reviewSubmitted;
    }
    if (typeof body.status === "string" && ["PENDING", "SENT", "FAILED", "ARCHIVED"].includes(body.status)) {
      set.status = body.status;
    }
    if (body.message !== undefined) {
      set.message = typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : undefined;
    }

    const updated = await ReviewRequest.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true }
    ).populate("clientId", "name businessName").lean();

    if (!updated) {
      return NextResponse.json({ error: "Review request not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating review request:", error);
    return NextResponse.json({ error: "Failed to update review request" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const archived = await ReviewRequest.findByIdAndUpdate(
      id,
      { $set: { status: "ARCHIVED" } },
      { new: true }
    ).populate("clientId", "name businessName").lean();

    if (!archived) {
      return NextResponse.json({ error: "Review request not found" }, { status: 404 });
    }

    return NextResponse.json(archived);
  } catch (error) {
    console.error("Error archiving review request:", error);
    return NextResponse.json({ error: "Failed to archive review request" }, { status: 500 });
  }
}
