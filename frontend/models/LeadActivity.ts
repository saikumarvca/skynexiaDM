import * as mongoose from "mongoose";

export type LeadActivityType =
  | "NOTE"
  | "EMAIL"
  | "CALL"
  | "MEETING"
  | "STATUS_CHANGE"
  | "ASSIGNMENT";

export interface ILeadActivity extends mongoose.Document {
  leadId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  type: LeadActivityType;
  body: string;
  performedBy?: string;
  performedAt: Date;
  metadata?: Record<string, unknown>;
}

const LeadActivitySchema = new mongoose.Schema<ILeadActivity>(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    type: {
      type: String,
      enum: ["NOTE", "EMAIL", "CALL", "MEETING", "STATUS_CHANGE", "ASSIGNMENT"],
      required: true,
    },
    body: { type: String, required: true },
    performedBy: { type: String },
    performedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: false },
);

LeadActivitySchema.index({ leadId: 1, performedAt: -1 });
LeadActivitySchema.index({ clientId: 1, performedAt: -1 });

const LeadActivity =
  (mongoose.models.LeadActivity as mongoose.Model<ILeadActivity> | undefined) ||
  mongoose.model<ILeadActivity>("LeadActivity", LeadActivitySchema);

export default LeadActivity;
