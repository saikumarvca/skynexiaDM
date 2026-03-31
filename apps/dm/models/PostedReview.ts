import * as mongoose from "mongoose";

export interface IPostedReview extends mongoose.Document {
  agencyId?: mongoose.Types.ObjectId | null;
  allocationId: mongoose.Types.ObjectId;
  draftId: mongoose.Types.ObjectId;
  postedByName: string;
  customerContact?: string;
  platform: string;
  reviewLink?: string;
  proofUrl?: string;
  postedDate: Date;
  markedUsedBy: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostedReviewSchema: mongoose.Schema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      default: null,
    },
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReviewAllocation",
      required: true,
    },
    draftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReviewDraft",
      required: true,
    },
    postedByName: { type: String, required: true },
    customerContact: { type: String },
    platform: { type: String, required: true },
    reviewLink: { type: String },
    proofUrl: { type: String },
    postedDate: { type: Date, required: true },
    markedUsedBy: { type: String, required: true },
    remarks: { type: String },
  },
  { timestamps: true },
);

PostedReviewSchema.index({ allocationId: 1 });
PostedReviewSchema.index({ draftId: 1 });
PostedReviewSchema.index({ agencyId: 1, postedDate: -1 });
PostedReviewSchema.index({ postedDate: -1 });

const PostedReview =
  (mongoose.models.PostedReview as mongoose.Model<IPostedReview> | undefined) ||
  mongoose.model<IPostedReview>("PostedReview", PostedReviewSchema);

export default PostedReview;
