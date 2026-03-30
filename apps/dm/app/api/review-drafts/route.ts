import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";
import Client from "@/models/Client";
import { logActivity } from "@/lib/review-activity";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import { getOrCreateUnassignedClient } from "@/lib/reviews/unassigned-client";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, ["manage_reviews"]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const language = searchParams.get("language");
    const reusable = searchParams.get("reusable");
    const search = searchParams.get("search");
    const createdBy = searchParams.get("createdBy");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (status && status !== "ALL") query.status = status;
    if (category) query.category = category;
    if (language) query.language = language;
    if (reusable === "true") query.reusable = true;
    if (reusable === "false") query.reusable = false;
    if (createdBy) query.createdBy = createdBy;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { reviewText: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const drafts = await ReviewDraft.find(query)
      .populate("clientId", "name businessName")
      .sort({ createdAt: -1 });

    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Error fetching review drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch review drafts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, ["manage_reviews"]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const body = await request.json();
    const { createdBy = "system", clientId, clientName, ...rest } = body;

    let resolvedClientId = clientId;
    let resolvedClientName = clientName;
    if (!resolvedClientId) {
      const unassignedClient = await getOrCreateUnassignedClient();
      resolvedClientId = unassignedClient._id.toString();
      resolvedClientName =
        unassignedClient.businessName ?? unassignedClient.name ?? "Unassigned";
    } else if (!resolvedClientName) {
      const client = await Client.findById(resolvedClientId).select(
        "name businessName",
      );
      if (client) {
        resolvedClientName = client.businessName ?? client.name;
      }
    }

    const draft = new ReviewDraft({
      ...rest,
      clientId: resolvedClientId,
      clientName: resolvedClientName ?? "Unassigned",
      createdBy,
    });
    await draft.save();

    const populated = await ReviewDraft.findById(draft._id).populate(
      "clientId",
      "name businessName",
    );

    await logActivity({
      entityType: "DRAFT",
      entityId: draft._id.toString(),
      action: "CREATE",
      newValue: populated?.toObject(),
      performedBy: createdBy,
    });

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Error creating review draft:", error);
    return NextResponse.json(
      { error: "Failed to create review draft" },
      { status: 500 },
    );
  }
}
