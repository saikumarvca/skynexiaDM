import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { reviewAllocationVerifySchema } from "@/lib/api/schemas";
import { resolveUserHierarchyContext } from "@/lib/team/scope-filters";
import { resolvePersistedAssignee } from "@/lib/reviews/allocation-assignee";
import dbConnect from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;
    const authz = await requireAnyPermissionApi(request, ["manage_settings"]);
    if (authz.denied) return authz.denied;

    const ctx = resolveUserHierarchyContext(authz);
    if (!ctx.isAdmin || ctx.accountType !== "MAIN_EMPLOYEE") {
      return apiError(403, "Only main agency admin can verify assignment targets", "VALIDATION_ERROR");
    }

    await dbConnect();
    const parsed = await parseWithSchema(request, reviewAllocationVerifySchema);
    if (!parsed.ok) return parsed.response;

    const resolved = await resolvePersistedAssignee(authz, parsed.data.assignee);
    return NextResponse.json({
      ok: true,
      assignee: resolved,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
    if (code === "ASSIGNEE_NOT_FOUND" || code === "PARTNER_AGENCY_NOT_FOUND") {
      return apiError(404, "Assignee target not found", "NOT_FOUND");
    }
    if (code === "ASSIGNEE_TYPE_MISMATCH" || code === "ASSIGNEE_AGENCY_MISMATCH") {
      return apiError(422, "Assignee target is invalid", "VALIDATION_ERROR");
    }
    if (code === "FORBIDDEN_SCOPE_ESCALATION" || code === "FORBIDDEN") {
      return apiError(403, "Forbidden", "VALIDATION_ERROR");
    }
    console.error("Error verifying allocation assignee:", error);
    return apiError(500, "Failed to verify assignee target", "INTERNAL_ERROR");
  }
}
