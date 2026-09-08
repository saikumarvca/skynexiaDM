import * as mongoose from "mongoose";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "REVIEW_ASSIGNED"
  | "CAMPAIGN_UPDATED"
  | "LEAD_UPDATED"
  | "SYSTEM"
  // Client-portal notifications (always carry clientId).
  | "REVIEW_SHARED"
  | "REVIEW_POSTED"
  | "REVIEW_PROGRESS"
  | "REVIEW_MILESTONE"
  | "CLIENT_UPDATE";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "TASK_ASSIGNED",
  "REVIEW_ASSIGNED",
  "CAMPAIGN_UPDATED",
  "LEAD_UPDATED",
  "SYSTEM",
  "REVIEW_SHARED",
  "REVIEW_POSTED",
  "REVIEW_PROGRESS",
  "REVIEW_MILESTONE",
  "CLIENT_UPDATE",
];

export interface INotification extends mongoose.Document {
  userId: string;
  agencyId?: mongoose.Types.ObjectId | null;
  /** Set for notifications addressed to a client login. */
  clientId?: mongoose.Types.ObjectId | null;
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
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      default: null,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    href: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ agencyId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ clientId: 1, createdAt: -1 });

const Notification =
  (mongoose.models.Notification as mongoose.Model<INotification> | undefined) ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
