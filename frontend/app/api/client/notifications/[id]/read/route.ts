import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { denyIfPreview, requireClientSessionApi } from "@/lib/client-portal/session";
import { toNotificationItem } from "@/lib/client-portal/client-notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/client/notifications/[id]/read — only the owner's own notification. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;
  const readOnly = denyIfPreview(auth.ctx);
  if (readOnly) return readOnly;

  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    await dbConnect();
    const doc = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: auth.ctx.userId,
        clientId: new mongoose.Types.ObjectId(auth.ctx.clientId),
      },
      { isRead: true },
      { new: true },
    )
      .select("_id type title message href isRead createdAt")
      .lean();
    if (!doc) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json(toNotificationItem(doc as Parameters<typeof toNotificationItem>[0]));
  } catch (error) {
    console.error("Error marking client notification read:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
