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

// Prevent model overwrite during hot reload
const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;