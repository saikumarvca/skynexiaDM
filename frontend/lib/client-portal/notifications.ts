import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Notification, { type NotificationType } from "@/models/Notification";

/**
 * Fan a client-portal notification out to every active CLIENT login of one
 * client. Notifications are per user (so each login has its own read state)
 * and carry `clientId` so the portal can scope them.
 */
export async function notifyClientUsers(params: {
  clientId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
}): Promise<number> {
  try {
    if (!mongoose.isValidObjectId(params.clientId)) return 0;
    await dbConnect();
    const users = await User.find({
      role: "CLIENT",
      isActive: true,
      clientId: new mongoose.Types.ObjectId(params.clientId),
    })
      .select("_id")
      .lean();
    if (users.length === 0) return 0;

    await Notification.insertMany(
      users.map((u) => ({
        userId: String(u._id),
        clientId: new mongoose.Types.ObjectId(params.clientId),
        type: params.type,
        title: params.title,
        message: params.message,
        href: params.href,
        isRead: false,
      })),
    );
    return users.length;
  } catch (error) {
    console.error("Failed to notify client users:", error);
    return 0;
  }
}
