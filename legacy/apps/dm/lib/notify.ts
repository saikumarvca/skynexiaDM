import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

type NotificationType =
  | "TASK_ASSIGNED"
  | "REVIEW_ASSIGNED"
  | "CAMPAIGN_UPDATED"
  | "LEAD_UPDATED"
  | "SYSTEM";

export async function createNotification(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
}): Promise<void> {
  try {
    await dbConnect();
    await Notification.create(opts);
  } catch (e) {
    console.error("Failed to create notification:", e);
    // Don't throw — notifications should never break the main flow
  }
}
