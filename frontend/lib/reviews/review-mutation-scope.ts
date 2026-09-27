import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import ReviewAllocation from "@/models/ReviewAllocation";
import ReviewDraft from "@/models/ReviewDraft";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import {
  andFilters,
  buildReviewScopeFilter,
  resolveUserHierarchyContext,
} from "@/lib/team/scope-filters";

type AllocationDocument = InstanceType<typeof ReviewAllocation>;

export type ScopedReviewMutationResult =
  | {
      denied: Response;
      allocation: null;
      canManage: false;
      scopeFilter: null;
    }
  | {
      denied: null;
      allocation: AllocationDocument | null;
      canManage: boolean;
      scopeFilter: Record<string, unknown>;
    };

export async function findReviewAllocationForMutation(
  request: NextRequest,
  id: string,
  options?: {
    requiredPermissions?: string[];
    workerPermission?: string;
    managerPermissions?: string[];
  },
): Promise<ScopedReviewMutationResult> {
  const requiredPermissions = options?.requiredPermissions ?? [
    "manage_reviews",
    "work_assigned_reviews",
  ];
  const authz = await requireAnyPermissionApi(request, requiredPermissions);
  if (authz.denied) {
    return {
      denied: authz.denied,
      allocation: null,
      canManage: false,
      scopeFilter: null,
    };
  }

  if (!mongoose.isValidObjectId(id)) {
    return {
      denied: null,
      allocation: null,
      canManage: false,
      scopeFilter: { _id: { $in: [] } },
    };
  }

  const ctx = resolveUserHierarchyContext(authz);
  const managerPermissions = options?.managerPermissions ?? ["manage_reviews"];
  const canManage = managerPermissions.some((permission) =>
    authz.perms.includes(permission),
  );
  const workerPermission = options?.workerPermission ?? "work_assigned_reviews";
  const workerOnly =
    !canManage &&
    !!workerPermission &&
    authz.perms.includes(workerPermission);

  // Allocation documents do not carry clientId directly. For main-agency
  // users with assigned-client restrictions, translate those client ids to
  // draft ids and constrain the allocation query at the database boundary.
  let clientDraftScope: Record<string, unknown> = {};
  if (
    !ctx.isAdmin &&
    ctx.accountType === "MAIN_EMPLOYEE" &&
    ctx.assignedClientIds.length > 0
  ) {
    const draftIds = await ReviewDraft.find({
      clientId: { $in: ctx.assignedClientIds },
    }).distinct("_id");
    clientDraftScope = { draftId: { $in: draftIds } };
  }

  const hierarchyScope = buildReviewScopeFilter(
    { ...ctx, assignedClientIds: [] },
    { workerOnly },
  );

  const scopeFilter = andFilters(
    { _id: id },
    hierarchyScope,
    clientDraftScope,
  );
  const allocation = await ReviewAllocation.findOne(scopeFilter);

  return { denied: null, allocation, canManage, scopeFilter };
}
