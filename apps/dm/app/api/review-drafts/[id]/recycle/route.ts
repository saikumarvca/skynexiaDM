import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";
import { logActivity } from "@/lib/review-activity";
import { apiError } from "@/lib/api/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/review-drafts/[id]/recycle
 *
 * Resets a Used or Archived draft back to "Available" so it can be re-assigned.
 * Only users with manage_reviews permission can recycle drafts.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, ["manage_reviews"]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const performedBy: string = (body as { performedBy?: string }).performedBy ?? "system";

    const draft = await ReviewDraft.findById(id);
    if (!draft) {
      return apiError(404, "Draft not found", "NOT_FOUND");
    }

    if (draft.status !== "Used" && draft.status !== "Archived") {
      return apiError(
        400,
        `Cannot recycle a draft with status "${draft.status}". Only Used or Archived drafts can be recycled.`,
        "VALIDATION_ERROR",
      );
    }

    const oldStatus = draft.status;
    const updated = await ReviewDraft.findByIdAndUpdate(
      id,
      { status: "Available", updatedAt: new Date() },
      { new: true },
    ).populate("clientId", "name businessName");

    await logActivity({
      entityType: "DRAFT",
      entityId: id,
      action: "RECYCLE",
      oldValue: { status: oldStatus },
      newValue: { status: "Available" },
      performedBy,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error recycling review draft:", error);
    const msg = error instanceof Error ? error.message : "Failed to recycle draft";
    return apiError(500, msg, "INTERNAL_ERROR");
  }
}
