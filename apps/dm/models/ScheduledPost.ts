import * as mongoose from "mongoose";

export type ScheduledPostStatus =
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED';

export interface IScheduledPost extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  contentId?: mongoose.Types.ObjectId | null;
  content: string;
  platform: string;
  publishDate: Date;
  timeZone?: string;
  status: ScheduledPostStatus;
  createdBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledPostSchema: mongoose.Schema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', default: null },
    content: { type: String, required: true },
    platform: { type: String, required: true },
    publishDate: { type: Date, required: true },
    timeZone: { type: String },
    status: {
      type: String,
      enum: ['SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

ScheduledPostSchema.index({ clientId: 1, platform: 1, status: 1, publishDate: 1 });

const ScheduledPost =
  (mongoose.models.ScheduledPost as mongoose.Model<IScheduledPost> | undefined) ||
  mongoose.model<IScheduledPost>('ScheduledPost', ScheduledPostSchema);

export default ScheduledPost;

