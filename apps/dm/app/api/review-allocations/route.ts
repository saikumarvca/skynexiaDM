import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewAllocation from "@/models/ReviewAllocation";
import { logActivity } from "@/lib/review-activity";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";

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
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const groupByContact = searchParams.get("groupByContact");

    // Special mode: return unique customer contacts for a client (used for autocomplete)
    if (groupByContact === "true" && clientId) {
      const contacts = await ReviewAllocation.aggregate([
        {
          $lookup: {
            from: "reviewdrafts",
            localField: "draftId",
            foreignField: "_id",
            as: "draft",
          },
        },
        { $unwind: { path: "$draft", preserveNullAndEmptyArrays: false } },
        {
          $match: {
            "draft.clientId": clientId,
            customerContact: { $exists: true, $nin: [null, ""] },
          },
        },
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

    const query: Record<string, unknown> = {};
    if (status && status !== "ALL") query.allocationStatus = status;
    if (assignedToUserId) query.assignedToUserId = assignedToUserId;
    if (platform) query.platform = platform;
    if (draftIds) {
      const ids = draftIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        query.draftId = { $in: ids };
      }
    }

    if (dateFrom || dateTo) {
      query.assignedDate = {};
      if (dateFrom)
        (query.assignedDate as Record<string, unknown>).$gte = new Date(
          dateFrom,
        );
      if (dateTo)
        (query.assignedDate as Record<string, unknown>).$lte = new Date(
          dateTo + "T23:59:59.999Z",
        );
    }

    const canSeeAll =
      authz.perms.includes("manage_reviews") || authz.perms.includes("assign_reviews");
    if (!canSeeAll && authz.perms.includes("work_assigned_reviews")) {
      if (!authz.teamMemberId) {
        return NextResponse.json([], { status: 200 });
      }
      query.assignedToUserId = authz.teamMemberId;
    }

    let allocations = await ReviewAllocation.find(query)
      .populate("draftId", "subject reviewText clientId clientName")
      .sort({ createdAt: -1 });

    if (clientId) {
      allocations = allocations.filter((a) => {
        const draft = a.draftId as {
          clientId?: { toString: () => string };
          _id?: unknown;
        };
        return draft?.clientId?.toString?.() === clientId;
      });
    }

    if (search) {
      const s = search.toLowerCase();
      allocations = allocations.filter((a) => {
        const draft = a.draftId as {
          subject?: string;
          reviewText?: string;
        } | null;
        const subject = (draft?.subject ?? "").toLowerCase();
        const reviewText = (draft?.reviewText ?? "").toLowerCase();
        const customerName = (a.customerName ?? "").toLowerCase();
        const platformStr = (a.platform ?? "").toLowerCase();
        return (
          subject.includes(s) ||
          reviewText.includes(s) ||
          customerName.includes(s) ||
          platformStr.includes(s)
        );
      });
    }

    return NextResponse.json(allocations);
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

    const body = await request.json();
    const allocation = new ReviewAllocation(body);
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
