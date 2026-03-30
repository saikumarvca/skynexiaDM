import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewAllocation from "@/models/ReviewAllocation";
import { logActivity } from "@/lib/review-activity";
import { z } from "zod";

const allocationPatchSchema = z
  .object({
    assignedToUserId: z.string().trim().min(1).optional(),
    assignedToUserName: z.string().trim().min(1).optional(),
    platform: z.string().trim().min(1).optional(),
    customerName: z.string().trim().min(1).optional(),
    customerContact: z.string().trim().min(1).optional(),
    allocationStatus: z
      .enum(["Assigned", "Shared with Customer", "Posted", "Used", "Cancelled"])
      .optional(),
    assignedDate: z.coerce.date().optional(),
    sentDate: z.coerce.date().optional(),
    remarks: z.string().trim().max(2000).optional(),
  })
  .strict();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { id } = await params;
    const allocation = await ReviewAllocation.findById(id).populate(
      "draftId",
      "subject reviewText clientId clientName",
    );
    if (!allocation) {
      return NextResponse.json(
        { error: "Allocation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(allocation);
  } catch (error) {
    console.error("Error fetching review allocation:", error);
    return NextResponse.json(
      { error: "Failed to fetch review allocation" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { id } = await params;
    const payload = await request.json();
    const performedBy =
      typeof payload?.performedBy === "string" ? payload.performedBy : "system";
    const { performedBy: _ignored, ...updatablePayload } = payload ?? {};
    const parsed = allocationPatchSchema.safeParse(updatablePayload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await ReviewAllocation.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Allocation not found" },
        { status: 404 },
      );
    }

    const allocation = await ReviewAllocation.findOneAndUpdate(
      { _id: id },
      { ...parsed.data, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("draftId", "subject reviewText clientName");

    await logActivity({
      entityType: "ALLOCATION",
      entityId: id,
      action: "UPDATE",
      oldValue: existing.toObject(),
      newValue: allocation?.toObject(),
      performedBy,
    });

    return NextResponse.json(allocation);
  } catch (error) {
    console.error("Error updating review allocation:", error);
    return NextResponse.json(
      { error: "Failed to update review allocation" },
      { status: 500 },
    );
  }
}
