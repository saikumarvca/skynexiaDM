import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewAllocation from "@/models/ReviewAllocation";
import ReviewDraft from "@/models/ReviewDraft";
import { logActivity } from "@/lib/review-activity";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import { parseWithSchema, apiError } from "@/lib/api/validation";
import { reviewAllocationCreateSchema } from "@/lib/api/schemas";
import {
  andFilters,
  buildReviewScopeFilter,
  resolveUserHierarchyContext,
} from "@/lib/team/scope-filters";
import {
  resolvePersistedAssignee,
  toAssigneeInput,
} from "@/lib/reviews/allocation-assignee";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, [
      "manage_reviews",
      "assign_reviews",
      "work_assigned_reviews",
      "view_reviews",
    ]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const assignedToUserId = searchParams.get("assignedToUserId");
    const draftIds = searchParams.get("draftIds");
    const platform = searchParams.get("platform");
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const groupByContact = searchParams.get("groupByContact");
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1,
    );
    const pageSize = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(
          searchParams.get("pageSize") || searchParams.get("limit") || "25",
          10,
        ) || 25,
      ),
    );

    const ctx = resolveUserHierarchyContext(authz);
    const canSeeAll =
      authz.perms.includes("manage_reviews") ||
      authz.perms.includes("assign_reviews");
    const workerOnly =
      !canSeeAll && authz.perms.includes("work_assigned_reviews");

    let allowedClientIds: string[] | null = null;
    if (
      ctx.accountType === "MAIN_EMPLOYEE" &&
      !ctx.isAdmin &&
      ctx.assignedClientIds.length > 0
    ) {
      allowedClientIds = [...ctx.assignedClientIds];
      if (clientId) {
        allowedClientIds = allowedClientIds.includes(clientId) ? [clientId] : [];
      }
    } else if (clientId) {
      allowedClientIds = [clientId];
    }

    let clientScopedDraftIds: string[] | null = null;
    if (allowedClientIds !== null) {
      const docs = await ReviewDraft.find({
        clientId: { $in: allowedClientIds },
      })
        .select("_id")
        .lean();
      clientScopedDraftIds = docs.map((draft) => String(draft._id));
    }

    const baseReviewScope = buildReviewScopeFilter(
      { ...ctx, assignedClientIds: [] },
      { workerOnly },
    );

    const query: Record<string, unknown> = {};
    if (status && status !== "ALL") query.allocationStatus = status;
    if (assignedToUserId) query.assignedToUserId = assignedToUserId;
    if (platform) query.platform = platform;

    const explicitDraftIds = draftIds
      ? draftIds
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    const draftFilters: Record<string, unknown>[] = [];
    if (clientScopedDraftIds !== null) {
      draftFilters.push({ draftId: { $in: clientScopedDraftIds } });
    }
    if (explicitDraftIds.length > 0) {
      draftFilters.push({ draftId: { $in: explicitDraftIds } });
    }

    if (dateFrom || dateTo) {
      query.assignedDate = {};
      if (dateFrom) {
        (query.assignedDate as Record<string, unknown>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        (query.assignedDate as Record<string, unknown>).$lte = new Date(
          dateTo + "T23:59:59.999Z",
        );
      }
    }

    if (search) {
      const escaped = search.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      const matchingDraftIds = await ReviewDraft.find({
        $or: [{ subject: regex }, { reviewText: regex }, { clientName: regex }],
      }).distinct("_id");
      query.$or = [
        { draftId: { $in: matchingDraftIds } },
        { customerName: regex },
        { customerContact: regex },
        { platform: regex },
        { assignedToUserName: regex },
      ];
    }

    const reviewScope = andFilters(baseReviewScope, ...draftFilters);

    if (groupByContact === "true" && clientId) {
      const contacts = await ReviewAllocation.aggregate([
        { $match: andFilters(query, reviewScope) },
        { $match: { customerContact: { $exists: true, $nin: [null, ""] } } },
        {
          $group: {
            _id: "$customerContact",
            customerName: { $last: "$customerName" },
            lastUsedAt: { $max: "$assignedDate" },
            usedCount: { $sum: 1 },
          },
        },
        { $sort: { usedCount: -1, lastUsedAt: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            customerContact: "$_id",
            customerName: 1,
            lastUsedAt: 1,
            usedCount: 1,
          },
        },
      ]);
      return NextResponse.json(contacts);
    }

    const scopedQuery = andFilters(query, reviewScope);
    const [items, total] = await Promise.all([
      ReviewAllocation.find(scopedQuery)
        .populate("draftId", "subject reviewText clientId clientName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      ReviewAllocation.countDocuments(scopedQuery),
    ]);

    return NextResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching review allocations:", error);
    return NextResponse.json(
      { error: "Failed to fetch review allocations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, [
      "manage_reviews",
      "assign_reviews",
    ]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const parsed = await parseWithSchema(request, reviewAllocationCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    if (!body.draftId) {
      return apiError(422, "draftId is required", "VALIDATION_ERROR");
    }
    const assignee = toAssigneeInput(body);
    let persistedAssignee;
    try {
      persistedAssignee = await resolvePersistedAssignee(authz, assignee);
    } catch (error) {
      const code = error instanceof Error ? error.message : "FORBIDDEN";
      if (code === "FORBIDDEN") return apiError(403, "Forbidden", "VALIDATION_ERROR");
      if (code === "FORBIDDEN_SCOPE_ESCALATION") {
        return apiError(403, "Assignee target is outside your scope", "VALIDATION_ERROR");
      }
      if (code === "ASSIGNEE_NOT_FOUND" || code === "PARTNER_AGENCY_NOT_FOUND") {
        return apiError(404, "Assignee target not found", "NOT_FOUND");
      }
      if (code === "ASSIGNEE_TYPE_MISMATCH" || code === "ASSIGNEE_AGENCY_MISMATCH") {
        return apiError(422, "Assignee target is invalid", "VALIDATION_ERROR");
      }
      throw error;
    }
    const allocation = new ReviewAllocation({
      ...persistedAssignee,
      agencyId: authz.agencyId ?? null,
      draftId: body.draftId,
      assignedByUserId: body.assignedByUserId,
      assignedByUserName: body.assignedByUserName,
      customerName: body.customerName,
      customerContact: body.customerContact,
      platform: body.platform,
    });
    await allocation.save();

    const populated = await ReviewAllocation.findById(allocation._id).populate(
      "draftId",
      "subject reviewText clientName",
    );

    await logActivity({
      entityType: "ALLOCATION",
      entityId: allocation._id.toString(),
      action: "CREATE",
      newValue: populated?.toObject(),
      performedBy: body.assignedByUserName ?? "system",
    });

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Error creating review allocation:", error);
    return NextResponse.json(
      { error: "Failed to create review allocation" },
      { status: 500 },
    );
  }
}
