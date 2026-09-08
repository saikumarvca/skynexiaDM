import dbConnect from "@/lib/mongodb";
import Notification, { type NotificationType } from "@/models/Notification";

export async function createNotification(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  /** For notifications addressed to a client login. */
  clientId?: string;
}): Promise<void> {
  try {
    await dbConnect();
    await Notification.create(opts);
  } catch (e) {
    console.error("Failed to create notification:", e);
    // Don't throw — notifications should never break the main flow
  }
}
