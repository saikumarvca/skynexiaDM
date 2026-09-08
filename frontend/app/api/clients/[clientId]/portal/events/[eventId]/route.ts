import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ClientEvent from "@/models/ClientEvent";
import { requireClientPortalStaff } from "@/lib/client-portal/staff-access";
import { recordClientPortalAudit } from "@/lib/client-portal/audit";
import { toActivityItem } from "@/lib/client-portal/analytics";

interface RouteParams {
  params: Promise<{ clientId: string; eventId: string }>;
}

/** PATCH /api/clients/[clientId]/portal/events/[eventId] { visibility } */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { clientId, eventId } = await params;
  const access = await requireClientPortalStaff(request, clientId);
  if (access.denied) return access.denied;

  const body = (await request.json().catch(() => ({}))) as { visibility?: string };
  const visibility = body.visibility?.toUpperCase();
  if (visibility !== "INTERNAL" && visibility !== "CLIENT_VISIBLE") {
    return NextResponse.json(
      { error: "visibility must be INTERNAL or CLIENT_VISIBLE" },
      { status: 400 },
    );
  }
  if (!mongoose.isValidObjectId(eventId)) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    await dbConnect();
    const doc = await ClientEvent.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(eventId),
        clientId: new mongoose.Types.ObjectId(access.clientId),
      },
      { $set: { visibility } },
      { new: true },
    ).lean();
    if (!doc) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await recordClientPortalAudit({
      action: "CLIENT_EVENT_VISIBILITY_CHANGED",
      actor: { userId: access.user.userId, name: access.user.name },
      clientId: access.clientId,
      targetName: String(doc.title),
      details: { eventId, visibility },
    });
    return NextResponse.json({
      ...toActivityItem(doc as Parameters<typeof toActivityItem>[0]),
      visibility: doc.visibility,
      source: doc.source,
    });
  } catch (error) {
    console.error("Error updating client event visibility:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
