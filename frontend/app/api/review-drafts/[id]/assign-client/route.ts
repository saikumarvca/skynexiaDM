import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";
import Client from "@/models/Client";
import { logActivity } from "@/lib/review-activity";
import { isUnassignedClientLike } from "@/lib/reviews/unassigned-client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, ["manage_reviews"]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const { id: draftId } = await params;
    if (!mongoose.Types.ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: "Invalid draft id" }, { status: 400 });
    }

    const body = (await request.json()) as {
      clientId?: string;
      performedBy?: string;
    };
    if (!body.clientId || !mongoose.Types.ObjectId.isValid(body.clientId)) {
      return NextResponse.json({ error: "Valid clientId is required" }, { status: 400 });
    }

    const draft = await ReviewDraft.findById(draftId).select("clientId clientName status");
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    if (draft.status !== "Available") {
      return NextResponse.json(
        { error: "Only available drafts can be reassigned to a client" },
        { status: 409 },
      );
    }

    const targetClient = await Client.findById(body.clientId).select(
      "_id name businessName email status",
    );
    if (!targetClient) {
      return NextResponse.json({ error: "Target client not found" }, { status: 404 });
    }
    if (targetClient.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Target client must be active" },
        { status: 400 },
      );
    }
    if (isUnassignedClientLike(targetClient)) {
      return NextResponse.json(
        { error: "Target client cannot be Unassigned" },
        { status: 400 },
      );
    }

    const oldValue = {
      clientId: draft.clientId?.toString?.() ?? "",
      clientName: draft.clientName,
    };
    const nextClientName = targetClient.businessName ?? targetClient.name;
    if (oldValue.clientId === targetClient._id.toString()) {
      return NextResponse.json({ message: "No change needed" }, { status: 200 });
    }

    draft.clientId = targetClient._id;
    draft.clientName = nextClientName;
    draft.updatedAt = new Date();
    await draft.save();

    await logActivity({
      entityType: "DRAFT",
      entityId: draftId,
      action: "REASSIGN_CLIENT",
      oldValue,
      newValue: {
        clientId: targetClient._id.toString(),
        clientName: nextClientName,
      },
      performedBy: body.performedBy ?? "system",
    });

    const populated = await ReviewDraft.findById(draftId).populate(
      "clientId",
      "name businessName",
    );
    return NextResponse.json(populated);
  } catch (error) {
    console.error("Error reassigning draft client:", error);
    return NextResponse.json(
      { error: "Failed to reassign draft client" },
      { status: 500 },
    );
  }
}
