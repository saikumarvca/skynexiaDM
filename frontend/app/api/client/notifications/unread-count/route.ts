import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import ClientUpdate from "@/models/ClientUpdate";
import { requireClientSessionApi } from "@/lib/client-portal/session";
import { clientNotificationFilter } from "@/lib/client-portal/client-notifications";

/** GET /api/client/notifications/unread-count → { count, unreadUpdates } */
export async function GET(request: NextRequest) {
  const auth = await requireClientSessionApi(request);
  if (auth.denied) return auth.denied;

  try {
    await dbConnect();
    const [count, unreadUpdates] = await Promise.all([
      Notification.countDocuments({ ...clientNotificationFilter(auth.ctx), isRead: false }),
      ClientUpdate.countDocuments({
        clientId: new mongoose.Types.ObjectId(auth.ctx.clientId),
        isPublished: true,
        isDeleted: { $ne: true },
        readByUserIds: { $ne: auth.ctx.userId },
      }),
    ]);
    return NextResponse.json({ count, unreadUpdates });
  } catch (error) {
    console.error("Error counting client notifications:", error);
    return NextResponse.json({ error: "Failed to count notifications" }, { status: 500 });
  }
}
