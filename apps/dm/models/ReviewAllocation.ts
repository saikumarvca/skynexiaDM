import * as mongoose from "mongoose";

export type AllocationStatus =
  | "Unassigned"
  | "Assigned"
  | "Shared with Customer"
  | "Posted"
  | "Used"
  | "Cancelled";

export interface IReviewAllocation extends mongoose.Document {
  agencyId?: mongoose.Types.ObjectId | null;
  assignedPartnerAgencyId?: mongoose.Types.ObjectId | null;
  draftId: mongoose.Types.ObjectId;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedByUserId: string;
  assignedByUserName: string;
  assignedDate: Date;
  customerName?: string;
  customerContact?: string;
  platform?: string;
  sentDate?: Date;
  allocationStatus: AllocationStatus;
  postedDate?: Date;
  usedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewAllocationSchema: mongoose.Schema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      default: null,
    },
    assignedPartnerAgencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      default: null,
    },
    draftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReviewDraft",
      required: true,
    },
    assignedToUserId: { type: String, required: true },
    assignedToUserName: { type: String, required: true },
    assignedByUserId: { type: String, required: true },
    assignedByUserName: { type: String, required: true },
    assignedDate: { type: Date, default: Date.now },
    customerName: { type: String },
    customerContact: { type: String },
    platform: { type: String },
    sentDate: { type: Date },
    allocationStatus: {
      type: String,
      enum: [
        "Unassigned",
        "Assigned",
        "Shared with Customer",
        "Posted",
        "Used",
        "Cancelled",
      ],
      default: "Assigned",
    },
    postedDate: { type: Date },
    usedDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true },
);

ReviewAllocationSchema.index({ draftId: 1 });
ReviewAllocationSchema.index({ assignedToUserId: 1 });
ReviewAllocationSchema.index({ assignedPartnerAgencyId: 1 });
ReviewAllocationSchema.index({ agencyId: 1, allocationStatus: 1, createdAt: -1 });
ReviewAllocationSchema.index({ allocationStatus: 1 });
ReviewAllocationSchema.index({ createdAt: -1 });

const ReviewAllocation =
  (mongoose.models.ReviewAllocation as
    | mongoose.Model<IReviewAllocation>
    | undefined) ||
  mongoose.model<IReviewAllocation>("ReviewAllocation", ReviewAllocationSchema);

export default ReviewAllocation;
