import * as mongoose from "mongoose";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "REVIEW_ASSIGNED"
  | "CAMPAIGN_UPDATED"
  | "LEAD_UPDATED"
  | "SYSTEM";

export interface INotification extends mongoose.Document {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: mongoose.Schema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ["TASK_ASSIGNED", "REVIEW_ASSIGNED", "CAMPAIGN_UPDATED", "LEAD_UPDATED", "SYSTEM"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    href: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

const Notification =
  (mongoose.models.Notification as mongoose.Model<INotification> | undefined) ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
