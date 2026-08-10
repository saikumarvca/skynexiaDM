import * as mongoose from "mongoose";

export type ApprovalStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

export interface IPortalApproval extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  entityType: "SCHEDULED_POST" | "CONTENT_ITEM";
  entityId: mongoose.Types.ObjectId;
  status: ApprovalStatus;
  clientComment?: string;
  reviewedAt?: Date;
  reviewedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortalApprovalSchema = new mongoose.Schema<IPortalApproval>(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    entityType: {
      type: String,
      enum: ["SCHEDULED_POST", "CONTENT_ITEM"],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "CHANGES_REQUESTED"],
      default: "PENDING",
    },
    clientComment: { type: String },
    reviewedAt: { type: Date },
    reviewedByName: { type: String },
  },
  { timestamps: true },
);

PortalApprovalSchema.index({ clientId: 1, status: 1 });
PortalApprovalSchema.index({ entityId: 1, entityType: 1 });

const PortalApproval =
  (mongoose.models.PortalApproval as
    | mongoose.Model<IPortalApproval>
    | undefined) ||
  mongoose.model<IPortalApproval>("PortalApproval", PortalApprovalSchema);

export default PortalApproval;
