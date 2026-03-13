import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  clientId: mongoose.Types.ObjectId;
  shortLabel: string;
  reviewText: string;
  category: string;
  language: string;
  ratingStyle: string;
  status: 'UNUSED' | 'USED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  shortLabel: { type: String, required: true },
  reviewText: { type: String, required: true },
  category: { type: String, required: true },
  language: { type: String, required: true },
  ratingStyle: { type: String, required: true },
  status: {
    type: String,
    enum: ['UNUSED', 'USED', 'ARCHIVED'],
    default: 'UNUSED'
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
ReviewSchema.index({ clientId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ category: 1 });
ReviewSchema.index({ language: 1 });

// Prevent model overwrite during hot reload in development
const Review = (mongoose.models.Review as mongoose.Model<IReview> | undefined) || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;