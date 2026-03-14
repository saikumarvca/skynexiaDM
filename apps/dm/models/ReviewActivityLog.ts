import mongoose, { Document, Schema } from 'mongoose';

export type EntityType = 'DRAFT' | 'ALLOCATION' | 'POSTED_REVIEW';

export interface IReviewActivityLog extends Document {
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  performedBy: string;
  performedAt: Date;
}

const ReviewActivityLogSchema: Schema = new Schema({
  entityType: {
    type: String,
    enum: ['DRAFT', 'ALLOCATION', 'POSTED_REVIEW'],
    required: true,
  },
  entityId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  performedBy: { type: String, required: true },
  performedAt: { type: Date, default: Date.now },
});

ReviewActivityLogSchema.index({ entityType: 1, entityId: 1, performedAt: -1 });

const ReviewActivityLog =
  (mongoose.models.ReviewActivityLog as mongoose.Model<IReviewActivityLog> | undefined) ||
  mongoose.model<IReviewActivityLog>('ReviewActivityLog', ReviewActivityLogSchema);

export default ReviewActivityLog;
