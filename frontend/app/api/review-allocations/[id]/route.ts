import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReviewAllocation from "@/models/ReviewAllocation";
import { logActivity } from "@/lib/review-activity";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { reviewAllocationPatchSchema } from "@/lib/api/schemas";
import {
  resolvePersistedAssignee,
  toAssigneeInput,
} from "@/lib/reviews/allocation-assignee";
import { findReviewAllocationForMutation } from "@/lib/reviews/review-mutation-scope";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const scoped = await findReviewAllocationForMutation(request, id, {
      requiredPermissions: [
        "view_reviews",
        "manage_reviews",
        "assign_reviews",
        "work_assigned_reviews",
      ],
      managerPermissions: ["view_reviews", "manage_reviews", "assign_reviews"],
      workerPermission: "work_assigned_reviews",
    });
    if (scoped.denied) return scoped.denied;

    await dbConnect();

    const allocation = await ReviewAllocation.findOne(
      scoped.scopeFilter ?? { _id: { $in: [] } },
    ).populate("draftId", "subject reviewText clientId clientName");

    if (!allocation) {
      return apiError(404, "Allocation not found", "NOT_FOUND");
    }
    return NextResponse.json(allocation);
  } catch (error) {
    console.error("Error fetching review allocation:", error);
    return apiError(500, "Failed to fetch review allocation", "INTERNAL_ERROR");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authz = await requireAnyPermissionApi(request, [
      "manage_reviews",
      "assign_reviews",
    ]);
    if (authz.denied) return authz.denied;

    const { id } = await params;
    const scoped = await findReviewAllocationForMutation(request, id, {
      requiredPermissions: ["manage_reviews", "assign_reviews"],
      managerPermissions: ["manage_reviews", "assign_reviews"],
      workerPermission: "",
    });
    if (scoped.denied) return scoped.denied;

    await dbConnect();

    const parsed = await parseWithSchema(request, reviewAllocationPatchSchema);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.data;
    const performedBy = payload.performedBy ?? "system";

    const existing = scoped.allocation;
    if (!existing || !scoped.scopeFilter) {
      return apiError(404, "Allocation not found", "NOT_FOUND");
    }

    // Lifecycle changes are owned by explicit workflow endpoints. Prevent the
    // generic editor from bypassing authorization/state/idempotency controls.
    if (
      payload.allocationStatus !== undefined &&
      payload.allocationStatus !== existing.allocationStatus
    ) {
      return apiError(
        409,
        "Use the review workflow transition endpoint to change allocation status",
        "CONFLICT",
        {
          from: existing.allocationStatus,
          requested: payload.allocationStatus,
        },
      );
    }

    const nextData: Record<string, unknown> = { ...payload };
    delete nextData.performedBy;
    delete nextData.assignee;
    delete nextData.assignedToUserId;
    delete nextData.assignedToUserName;
    delete nextData.assignedPartnerAgencyId;
    delete nextData.allocationStatus;

    if (payload.assignee || payload.assignedToUserId) {
      const assignee = toAssigneeInput(payload);
      try {
        const persistedAssignee = await resolvePersistedAssignee(authz, assignee);
        Object.assign(nextData, persistedAssignee);
      } catch (error) {
        const code = error instanceof Error ? error.message : "FORBIDDEN";
        if (code === "FORBIDDEN_SCOPE_ESCALATION") {
          return apiError(
            403,
            "Assignee target is outside your scope",
            "VALIDATION_ERROR",
          );
        }
        if (
          code === "ASSIGNEE_NOT_FOUND" ||
          code === "PARTNER_AGENCY_NOT_FOUND"
        ) {
          return apiError(404, "Assignee target not found", "NOT_FOUND");
        }
        if (
          code === "ASSIGNEE_TYPE_MISMATCH" ||
          code === "ASSIGNEE_AGENCY_MISMATCH"
        ) {
          return apiError(422, "Assignee target is invalid", "VALIDATION_ERROR");
        }
        if (code === "FORBIDDEN") {
          return apiError(403, "Forbidden", "VALIDATION_ERROR");
        }
        throw error;
      }
    }

    const allocation = await ReviewAllocation.findOneAndUpdate(
      scoped.scopeFilter,
      { ...nextData, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("draftId", "subject reviewText clientName");

    if (!allocation) {
      return apiError(404, "Allocation not found", "NOT_FOUND");
    }

    const reassignmentChanged =
      existing.assigneeType !== allocation.assigneeType ||
      String(existing.assigneeTeamMemberId ?? "") !==
        String(allocation.assigneeTeamMemberId ?? "") ||
      String(existing.assigneePartnerAgencyId ?? "") !==
        String(allocation.assigneePartnerAgencyId ?? "") ||
      existing.assignedToUserId !== allocation.assignedToUserId;

    if (reassignmentChanged) {
      await logActivity({
        entityType: "ALLOCATION",
        entityId: id,
        action: "REASSIGN",
        oldValue: {
          assigneeType: existing.assigneeType ?? "MAIN_EMPLOYEE",
          assigneeTeamMemberId: existing.assigneeTeamMemberId,
          assigneePartnerAgencyId:
            existing.assigneePartnerAgencyId?.toString?.(),
          assignedToUserId: existing.assignedToUserId,
          assignedToUserName: existing.assignedToUserName,
        },
        newValue: {
          assigneeType: allocation.assigneeType,
          assigneeTeamMemberId: allocation.assigneeTeamMemberId,
          assigneePartnerAgencyId:
            allocation.assigneePartnerAgencyId?.toString?.(),
          assignedToUserId: allocation.assignedToUserId,
          assignedToUserName: allocation.assignedToUserName,
        },
        performedBy,
      });
    }

    await logActivity({
      entityType: "ALLOCATION",
      entityId: id,
      action: "UPDATE",
      oldValue: existing.toObject(),
      newValue: allocation.toObject(),
      performedBy,
    });

    return NextResponse.json(allocation);
  } catch (error) {
    console.error("Error updating review allocation:", error);
    return apiError(500, "Failed to update review allocation", "INTERNAL_ERROR");
  }
}
