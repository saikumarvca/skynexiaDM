import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireAnyPermissionApi } from "@/lib/team/require-permission-api";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";
import Client from "@/models/Client";
import { logActivity } from "@/lib/review-activity";
import { isUnassignedClientLike } from "@/lib/reviews/unassigned-client";

type ReassignItem = {
  draftId: string;
  clientId: string;
};

type ReassignResult = {
  draftId: string;
  ok: boolean;
  message?: string;
};

export async function PATCH(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const authz = await requireAnyPermissionApi(request, ["manage_reviews"]);
    if (authz.denied) return authz.denied;

    await dbConnect();

    const body = (await request.json()) as {
      items?: ReassignItem[];
      performedBy?: string;
    };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "items must be a non-empty array" },
        { status: 400 },
      );
    }

    const performedBy = body.performedBy ?? "system";
    const results: ReassignResult[] = [];

    // Validate ids up front so we can batch-load drafts and clients in two
    // queries instead of two round-trips per item.
    const validItems: ReassignItem[] = [];
    for (const item of body.items) {
      const draftId = item?.draftId;
      const clientId = item?.clientId;
      if (
        !draftId ||
        !clientId ||
        !mongoose.Types.ObjectId.isValid(draftId) ||
        !mongoose.Types.ObjectId.isValid(clientId)
      ) {
        results.push({
          draftId: String(draftId ?? ""),
          ok: false,
          message: "Invalid draftId/clientId",
        });
        continue;
      }
      validItems.push({ draftId, clientId });
    }

    const draftIds = Array.from(new Set(validItems.map((i) => i.draftId)));
    const clientIds = Array.from(new Set(validItems.map((i) => i.clientId)));

    const [drafts, clients] = await Promise.all([
      draftIds.length
        ? ReviewDraft.find({ _id: { $in: draftIds } }).select(
            "clientId clientName status",
          )
        : [],
      clientIds.length
        ? Client.find({ _id: { $in: clientIds } }).select(
            "_id name businessName email status",
          )
        : [],
    ]);
    const draftById = new Map(drafts.map((d) => [d._id.toString(), d]));
    const clientById = new Map(clients.map((c) => [c._id.toString(), c]));

    for (const { draftId, clientId } of validItems) {
      const draft = draftById.get(draftId);
      const targetClient = clientById.get(clientId);

      if (!draft) {
        results.push({ draftId, ok: false, message: "Draft not found" });
        continue;
      }
      if (!targetClient) {
        results.push({ draftId, ok: false, message: "Target client not found" });
        continue;
      }
      // Allocations and posted reviews reference the draft, not the client, so
      // changing the draft's client is safe at any stage except once archived.
      if (draft.status === "Archived") {
        results.push({
          draftId,
          ok: false,
          message: "Archived drafts cannot be reassigned",
        });
        continue;
      }
      if (targetClient.status !== "ACTIVE" || isUnassignedClientLike(targetClient)) {
        results.push({
          draftId,
          ok: false,
          message: "Target must be an active real client",
        });
        continue;
      }
      if (draft.clientId?.toString?.() === targetClient._id.toString()) {
        results.push({ draftId, ok: true, message: "No change needed" });
        continue;
      }

      const oldValue = {
        clientId: draft.clientId?.toString?.() ?? "",
        clientName: draft.clientName,
      };
      const nextClientName = targetClient.businessName ?? targetClient.name;
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
        performedBy,
      });

      results.push({ draftId, ok: true });
    }

    const successCount = results.filter((r) => r.ok).length;
    const failedCount = results.length - successCount;
    return NextResponse.json({
      successCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error("Error bulk reassigning draft clients:", error);
    return NextResponse.json(
      { error: "Failed to bulk reassign clients" },
      { status: 500 },
    );
  }
}
