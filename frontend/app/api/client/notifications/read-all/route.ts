import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { denyIfPreview, requireClientSessionApi } from "@/lib/client-portal/session";

/** POST /api/client/notifications/read-all */
export async function POST(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;
  const readOnly = denyIfPreview(auth.ctx);
  if (readOnly) return readOnly;

  try {
    await dbConnect();
    const result = await Notification.updateMany(
      {
        userId: auth.ctx.userId,
        clientId: new mongoose.Types.ObjectId(auth.ctx.clientId),
        isRead: false,
      },
      { isRead: true },
    );
    return NextResponse.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error("Error marking client notifications read:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
