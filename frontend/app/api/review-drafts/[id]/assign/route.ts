import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import { logActivity } from "@/lib/review-activity";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { reviewAllocationCreateSchema } from "@/lib/api/schemas";
import {
  resolvePersistedAssignee,
  toAssigneeInput,
} from "@/lib/reviews/allocation-assignee";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;
    const authz = await requireAnyPermissionApi(request, [
      "manage_reviews",
      "assign_reviews",
    ]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const { id: draftId } = await params;
    const parsed = await parseWithSchema(request, reviewAllocationCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const assignee = toAssigneeInput(body);
    let persistedAssignee;
    try {
      persistedAssignee = await resolvePersistedAssignee(authz, assignee);
    } catch (error) {
      const code = error instanceof Error ? error.message : "FORBIDDEN";
      if (code === "FORBIDDEN_SCOPE_ESCALATION") {
        return apiError(403, "Assignee target is outside your scope", "VALIDATION_ERROR");
      }
      if (code === "ASSIGNEE_NOT_FOUND" || code === "PARTNER_AGENCY_NOT_FOUND") {
        return apiError(404, "Assignee target not found", "NOT_FOUND");
      }
      if (code === "ASSIGNEE_TYPE_MISMATCH" || code === "ASSIGNEE_AGENCY_MISMATCH") {
        return apiError(422, "Assignee target is invalid", "VALIDATION_ERROR");
      }
      if (code === "FORBIDDEN") {
        return apiError(403, "Forbidden", "VALIDATION_ERROR");
      }
      throw error;
    }

    const draft = await ReviewDraft.findById(draftId);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (!draft.reusable && draft.status === "Used") {
      return NextResponse.json(
        {
          error:
            "This draft is not reusable and has already been used. Cannot assign.",
        },
        { status: 400 },
      );
    }

    const allocation = new ReviewAllocation({
      draftId,
      ...persistedAssignee,
      assignedByUserId: body.assignedByUserId,
      assignedByUserName: body.assignedByUserName,
      customerName: body.customerName || undefined,
      customerContact: body.customerContact || undefined,
      platform: body.platform || undefined,
      allocationStatus: "Assigned",
    });
    await allocation.save();

    const newStatus = draft.status === "Available" ? "Allocated" : draft.status;
    await ReviewDraft.findByIdAndUpdate(draftId, {
      status: newStatus,
      updatedAt: new Date(),
    });

    const populated = await ReviewAllocation.findById(allocation._id).populate(
      "draftId",
      "subject reviewText clientName",
    );

    await logActivity({
      entityType: "ALLOCATION",
      entityId: allocation._id.toString(),
      action: "CREATE",
      newValue: populated?.toObject(),
      performedBy: body.assignedByUserName,
    });

    await logActivity({
      entityType: "DRAFT",
      entityId: draftId,
      action: "ALLOCATE",
      oldValue: { status: draft.status },
      newValue: { status: newStatus },
      performedBy: body.assignedByUserName,
    });

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Error assigning draft:", error);
    return NextResponse.json(
      { error: "Failed to assign draft" },
      { status: 500 },
    );
  }
}
