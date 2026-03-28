import * as mongoose from "mongoose";

export interface IReviewRequest extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  recipientName: string;
  recipientEmail: string;
  message?: string;
  status: "PENDING" | "SENT" | "FAILED" | "ARCHIVED";
  sentAt?: Date;
  reviewSubmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewRequestSchema: mongoose.Schema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    recipientName: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "ARCHIVED"],
      default: "PENDING",
    },
    sentAt: { type: Date },
    reviewSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewRequestSchema.index({ clientId: 1, createdAt: -1 });
ReviewRequestSchema.index({ status: 1 });

const ReviewRequest =
  (mongoose.models.ReviewRequest as mongoose.Model<IReviewRequest> | undefined) ||
  mongoose.model<IReviewRequest>("ReviewRequest", ReviewRequestSchema);

export default ReviewRequest;
