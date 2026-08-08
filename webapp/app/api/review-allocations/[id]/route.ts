import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
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
    const authz = await requireAnyPermissionApi(request, [
      "manage_reviews",
      "assign_reviews",
    ]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const { id } = await params;
    const parsed = await parseWithSchema(request, reviewAllocationPatchSchema);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.data;
    const performedBy = payload.performedBy ?? "system";

    const existing = await ReviewAllocation.findById(id);
    if (!existing) {
      return apiError(404, "Allocation not found", "NOT_FOUND");
    }

    const nextData: Record<string, unknown> = { ...payload };
    delete nextData.performedBy;
    delete nextData.assignee;
    delete nextData.assignedToUserId;
    delete nextData.assignedToUserName;
    delete nextData.assignedPartnerAgencyId;

    if (payload.assignee || payload.assignedToUserId) {
      const assignee = toAssigneeInput(payload);
      try {
        const persistedAssignee = await resolvePersistedAssignee(authz, assignee);
        Object.assign(nextData, persistedAssignee);
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
    }

    const allocation = await ReviewAllocation.findOneAndUpdate(
      { _id: id },
      { ...nextData, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("draftId", "subject reviewText clientName");

    const reassignmentChanged =
      existing.assigneeType !== allocation?.assigneeType ||
      String(existing.assigneeTeamMemberId ?? "") !==
        String(allocation?.assigneeTeamMemberId ?? "") ||
      String(existing.assigneePartnerAgencyId ?? "") !==
        String(allocation?.assigneePartnerAgencyId ?? "") ||
      existing.assignedToUserId !== allocation?.assignedToUserId;
    if (reassignmentChanged) {
      await logActivity({
        entityType: "ALLOCATION",
        entityId: id,
        action: "REASSIGN",
        oldValue: {
          assigneeType: existing.assigneeType ?? "MAIN_EMPLOYEE",
          assigneeTeamMemberId: existing.assigneeTeamMemberId,
          assigneePartnerAgencyId: existing.assigneePartnerAgencyId?.toString?.(),
          assignedToUserId: existing.assignedToUserId,
          assignedToUserName: existing.assignedToUserName,
        },
        newValue: {
          assigneeType: allocation?.assigneeType,
          assigneeTeamMemberId: allocation?.assigneeTeamMemberId,
          assigneePartnerAgencyId: allocation?.assigneePartnerAgencyId?.toString?.(),
          assignedToUserId: allocation?.assignedToUserId,
          assignedToUserName: allocation?.assignedToUserName,
        },
        performedBy,
      });
    }

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
