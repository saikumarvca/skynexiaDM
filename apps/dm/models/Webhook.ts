import * as mongoose from "mongoose";

export const WEBHOOK_EVENTS = [
  "lead.created",
  "campaign.created",
  "campaign.updated",
  "review.used",
  "task.created",
  "task.updated",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface IWebhook extends mongoose.Document {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema: mongoose.Schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    events: [{ type: String, required: true }],
    secret: { type: String },
    isActive: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date },
  },
  { timestamps: true }
);

WebhookSchema.index({ isActive: 1 });

const Webhook =
  (mongoose.models.Webhook as mongoose.Model<IWebhook> | undefined) ||
  mongoose.model<IWebhook>("Webhook", WebhookSchema);

export default Webhook;
