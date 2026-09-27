import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReviewAllocation from "@/models/ReviewAllocation";
import ReviewDraft from "@/models/ReviewDraft";
import { logActivity } from "@/lib/review-activity";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { markSharedSchema } from "@/lib/api/schemas";
import { andFilters } from "@/lib/team/scope-filters";
import { findReviewAllocationForMutation } from "@/lib/reviews/review-mutation-scope";
import { decideMarkShared } from "@/lib/reviews/review-state-machine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const scoped = await findReviewAllocationForMutation(request, id);
    if (scoped.denied) return scoped.denied;

    await dbConnect();

    const existing = scoped.allocation;
    if (!existing || !scoped.scopeFilter) {
      return apiError(404, "Allocation not found", "NOT_FOUND");
    }

    const decision = decideMarkShared(existing.allocationStatus);
    if (decision.kind === "invalid") {
      return apiError(
        409,
        `Cannot mark allocation as shared from status "${decision.from}"`,
        "CONFLICT",
        { from: decision.from, to: decision.to },
      );
    }

    // A repeated request for an already-shared allocation is intentionally
    // idempotent: return canonical state without appending duplicate activity.
    if (decision.kind === "idempotent") {
      const current = await ReviewAllocation.findOne(scoped.scopeFilter).populate(
        "draftId",
        "subject reviewText clientName",
      );
      return NextResponse.json(current);
    }

    const parsed = await parseWithSchema(request, markSharedSchema);
    if (!parsed.ok) return parsed.response;
    const {
      customerName,
      customerContact,
      platform,
      sentDate,
      performedBy = "system",
    } = parsed.data;

    const now = new Date();
    const update: Record<string, unknown> = {
      customerName: customerName.trim(),
      allocationStatus: "Shared with Customer",
      updatedAt: now,
    };
    if (customerContact) update.customerContact = customerContact;
    if (platform) update.platform = platform;
    if (sentDate) update.sentDate = new Date(sentDate);

    // Scope + current state are both part of the write filter. This prevents
    // stale/out-of-scope transitions even if assignment changes after read.
    let allocation = await ReviewAllocation.findOneAndUpdate(
      andFilters(scoped.scopeFilter, { allocationStatus: "Assigned" }),
      update,
      { new: true },
    ).populate("draftId", "subject reviewText clientName");

    if (!allocation) {
      const current = await ReviewAllocation.findOne(scoped.scopeFilter);
      if (!current) {
        return apiError(404, "Allocation not found", "NOT_FOUND");
      }
      const currentDecision = decideMarkShared(current.allocationStatus);
      if (currentDecision.kind === "idempotent") {
        allocation = await ReviewAllocation.findOne(scoped.scopeFilter).populate(
          "draftId",
          "subject reviewText clientName",
        );
        return NextResponse.json(allocation);
      }
      return apiError(
        409,
        `Allocation state changed to "${current.allocationStatus}"`,
        "CONFLICT",
      );
    }

    await ReviewDraft.findByIdAndUpdate(existing.draftId, {
      status: "Shared",
      updatedAt: now,
    });

    await logActivity({
      entityType: "ALLOCATION",
      entityId: id,
      action: "MARK_SHARED",
      oldValue: existing.toObject(),
      newValue: allocation.toObject(),
      performedBy,
    });

    return NextResponse.json(allocation);
  } catch (error) {
    console.error("Error marking allocation as shared:", error);
    return apiError(500, "Failed to mark as shared", "INTERNAL_ERROR");
  }
}
