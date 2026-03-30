import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewAllocation from "@/models/ReviewAllocation";
import ReviewDraft from "@/models/ReviewDraft";
import PostedReview from "@/models/PostedReview";
import { logActivity } from "@/lib/review-activity";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { markPostedSchema } from "@/lib/api/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { id } = await params;
    const parsed = await parseWithSchema(request, markPostedSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const {
      postedByName,
      customerContact,
      platform,
      reviewLink,
      proofUrl,
      postedDate,
      markedUsedBy,
      remarks,
      performedBy = "system",
    } = body;

    const existing = await ReviewAllocation.findById(id);
    if (!existing) {
      return apiError(404, "Allocation not found", "NOT_FOUND");
    }

    const postedReview = new PostedReview({
      allocationId: id,
      draftId: existing.draftId,
      postedByName: postedByName.trim(),
      customerContact: customerContact?.trim() || undefined,
      platform: platform.trim(),
      reviewLink: reviewLink.trim(),
      proofUrl: proofUrl?.trim() || undefined,
      postedDate: new Date(postedDate),
      markedUsedBy: markedUsedBy || performedBy,
      remarks: remarks?.trim(),
    });
    await postedReview.save();

    const now = new Date();
    await ReviewAllocation.findByIdAndUpdate(id, {
      allocationStatus: "Posted",
      postedDate: now,
      usedDate: now,
      updatedAt: now,
    });

    await ReviewDraft.findByIdAndUpdate(existing.draftId, {
      status: "Used",
      updatedAt: now,
    });

    await logActivity({
      entityType: "POSTED_REVIEW",
      entityId: postedReview._id.toString(),
      action: "CREATE",
      newValue: postedReview.toObject(),
      performedBy: markedUsedBy || performedBy,
    });

    await logActivity({
      entityType: "ALLOCATION",
      entityId: id,
      action: "MARK_POSTED",
      newValue: { allocationStatus: "Posted", postedDate: now },
      performedBy: markedUsedBy || performedBy,
    });

    const allocation = await ReviewAllocation.findById(id).populate(
      "draftId",
      "subject reviewText clientName",
    );

    return NextResponse.json({
      allocation,
      postedReview: await PostedReview.findById(postedReview._id),
    });
  } catch (error) {
    console.error("Error marking allocation as posted:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to mark as posted";
    return apiError(500, msg, "INTERNAL_ERROR");
  }
}
