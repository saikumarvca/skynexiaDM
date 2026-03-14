import mongoose, { Document, Schema } from 'mongoose';

export type ExternalReviewPlatform = 'GOOGLE' | 'FACEBOOK' | 'INSTAGRAM' | 'OTHER';

export interface IExternalReview extends Document {
  clientId: mongoose.Types.ObjectId;
  platform: ExternalReviewPlatform | string;
  authorName?: string;
  rating: number;
  text: string;
  reviewDate?: Date;
  responseText?: string;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  sourceId?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExternalReviewSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    platform: { type: String, required: true },
    authorName: { type: String },
    rating: { type: Number, required: true },
    text: { type: String, required: true },
    reviewDate: { type: Date },
    responseText: { type: String },
    sentiment: {
      type: String,
      enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'],
    },
    sourceId: { type: String },
    lastSyncedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

ExternalReviewSchema.index({ clientId: 1, platform: 1, rating: -1 });
ExternalReviewSchema.index({ clientId: 1, sentiment: 1 });
ExternalReviewSchema.index({ clientId: 1, reviewDate: -1 });

const ExternalReview =
  (mongoose.models.ExternalReview as mongoose.Model<IExternalReview> | undefined) ||
  mongoose.model<IExternalReview>('ExternalReview', ExternalReviewSchema);

export default ExternalReview;

