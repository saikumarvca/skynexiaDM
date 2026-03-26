import * as mongoose from "mongoose";

export interface IPostedReview extends mongoose.Document {
  allocationId: mongoose.Types.ObjectId;
  draftId: mongoose.Types.ObjectId;
  postedByName: string;
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
    allocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewAllocation', required: true },
    draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewDraft', required: true },
    postedByName: { type: String, required: true },
    platform: { type: String, required: true },
    reviewLink: { type: String },
    proofUrl: { type: String },
    postedDate: { type: Date, required: true },
    markedUsedBy: { type: String, required: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

PostedReviewSchema.index({ allocationId: 1 });
PostedReviewSchema.index({ draftId: 1 });
PostedReviewSchema.index({ postedDate: -1 });

const PostedReview =
  (mongoose.models.PostedReview as mongoose.Model<IPostedReview> | undefined) ||
  mongoose.model<IPostedReview>('PostedReview', PostedReviewSchema);

export default PostedReview;
