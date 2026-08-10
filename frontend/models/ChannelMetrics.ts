import * as mongoose from "mongoose";

/** Snapshot of a social channel’s subscriber count; populate via future cron or integrations. */
export interface IChannelMetrics extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  platform: string;
  channelId: string;
  channelName?: string;
  subscriberCount: number;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelMetricsSchema = new mongoose.Schema<IChannelMetrics>(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    platform: { type: String, required: true },
    channelId: { type: String, required: true },
    channelName: { type: String },
    subscriberCount: { type: Number, default: 0 },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

ChannelMetricsSchema.index({ clientId: 1, platform: 1, fetchedAt: -1 });
ChannelMetricsSchema.index(
  { clientId: 1, platform: 1, channelId: 1 },
  { unique: true },
);

const ChannelMetrics =
  (mongoose.models.ChannelMetrics as
    | mongoose.Model<IChannelMetrics>
    | undefined) ||
  mongoose.model<IChannelMetrics>("ChannelMetrics", ChannelMetricsSchema);

export default ChannelMetrics;
