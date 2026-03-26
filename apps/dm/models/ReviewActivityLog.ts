import * as mongoose from "mongoose";

export type EntityType = 'DRAFT' | 'ALLOCATION' | 'POSTED_REVIEW';

export interface IReviewActivityLog extends mongoose.Document {
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  performedBy: string;
  performedAt: Date;
}

const ReviewActivityLogSchema: mongoose.Schema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['DRAFT', 'ALLOCATION', 'POSTED_REVIEW'],
    required: true,
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  performedBy: { type: String, required: true },
  performedAt: { type: Date, default: Date.now },
});

ReviewActivityLogSchema.index({ entityType: 1, entityId: 1, performedAt: -1 });

const ReviewActivityLog =
  (mongoose.models.ReviewActivityLog as mongoose.Model<IReviewActivityLog> | undefined) ||
  mongoose.model<IReviewActivityLog>('ReviewActivityLog', ReviewActivityLogSchema);

export default ReviewActivityLog;
