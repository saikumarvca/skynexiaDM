import * as mongoose from "mongoose";

export interface IPostMetrics extends mongoose.Document {
  scheduledPostId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  platform: string;
  platformPostId?: string;
  fetchedAt: Date;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: number;
  videoViews?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostMetricsSchema = new mongoose.Schema<IPostMetrics>(
  {
    scheduledPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScheduledPost",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    platform: { type: String, required: true },
    platformPostId: { type: String },
    fetchedAt: { type: Date, required: true },
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    videoViews: { type: Number },
  },
  { timestamps: true },
);

PostMetricsSchema.index({ scheduledPostId: 1 });
PostMetricsSchema.index({ clientId: 1, platform: 1, fetchedAt: -1 });

const PostMetrics =
  (mongoose.models.PostMetrics as mongoose.Model<IPostMetrics> | undefined) ||
  mongoose.model<IPostMetrics>("PostMetrics", PostMetricsSchema);

export default PostMetrics;
