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
    }
  | {
      denied: null;
      allocation: AllocationDocument | null;
      canManage: boolean;
    };

export async function findReviewAllocationForMutation(
  request: NextRequest,
  id: string,
): Promise<ScopedReviewMutationResult> {
  const authz = await requireAnyPermissionApi(request, [
    "manage_reviews",
    "work_assigned_reviews",
  ]);
  if (authz.denied) {
    return { denied: authz.denied, allocation: null, canManage: false };
  }

  if (!mongoose.isValidObjectId(id)) {
    return { denied: null, allocation: null, canManage: false };
  }

  const ctx = resolveUserHierarchyContext(authz);
  const canManage = authz.perms.includes("manage_reviews");
  const workerOnly = !canManage && authz.perms.includes("work_assigned_reviews");

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

  const allocation = await ReviewAllocation.findOne(
    andFilters({ _id: id }, hierarchyScope, clientDraftScope),
  );

  return { denied: null, allocation, canManage };
}
