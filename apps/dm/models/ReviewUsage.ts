import * as mongoose from "mongoose";

export interface IReviewUsage extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  reviewId: mongoose.Types.ObjectId;
  sourceName: string;
  usedBy: string;
  profileName: string;
  usedAt: Date;
  notes?: string;
  createdAt: Date;
}

const ReviewUsageSchema: mongoose.Schema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  sourceName: { type: String, required: true },
  usedBy: { type: String, required: true },
  profileName: { type: String, required: true },
  usedAt: { type: Date, required: true },
  notes: { type: String },
}, {
  timestamps: true,
});

// Add indexes for better query performance
ReviewUsageSchema.index({ clientId: 1, usedAt: -1 });
ReviewUsageSchema.index({ reviewId: 1, usedAt: -1 });
ReviewUsageSchema.index({ usedAt: -1 });
ReviewUsageSchema.index({ sourceName: 1 });

// Prevent model overwrite during hot reload in development
const ReviewUsage = (mongoose.models.ReviewUsage as mongoose.Model<IReviewUsage> | undefined) || mongoose.model<IReviewUsage>('ReviewUsage', ReviewUsageSchema);

export default ReviewUsage;