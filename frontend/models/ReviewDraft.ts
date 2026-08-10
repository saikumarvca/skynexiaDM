import * as mongoose from "mongoose";

export type DraftStatus =
  | "Available"
  | "Allocated"
  | "Shared"
  | "Used"
  | "Archived";

export interface IReviewDraft extends mongoose.Document {
  agencyId?: mongoose.Types.ObjectId | null;
  assignedPartnerAgencyId?: mongoose.Types.ObjectId | null;
  subject: string;
  reviewText: string;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  category: string;
  language: string;
  suggestedRating: string;
  tone: string;
  reusable: boolean;
  status: DraftStatus;
  createdBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewDraftSchema: mongoose.Schema = new mongoose.Schema(
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
    subject: { type: String, required: true },
    reviewText: { type: String, required: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    clientName: { type: String, required: true },
    category: { type: String, required: true },
    language: { type: String, required: true },
    suggestedRating: { type: String, default: "5" },
    tone: { type: String, default: "Professional" },
    reusable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["Available", "Allocated", "Shared", "Used", "Archived"],
      default: "Available",
    },
    createdBy: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true },
);

ReviewDraftSchema.index({ clientId: 1, status: 1 });
ReviewDraftSchema.index({ agencyId: 1, status: 1, createdAt: -1 });
ReviewDraftSchema.index({ assignedPartnerAgencyId: 1, status: 1, createdAt: -1 });
ReviewDraftSchema.index({ status: 1, createdAt: -1 });
ReviewDraftSchema.index({ category: 1 });
ReviewDraftSchema.index({ language: 1 });
ReviewDraftSchema.index({ subject: 1, reviewText: 1 });

const ReviewDraft =
  (mongoose.models.ReviewDraft as mongoose.Model<IReviewDraft> | undefined) ||
  mongoose.model<IReviewDraft>("ReviewDraft", ReviewDraftSchema);

export default ReviewDraft;
