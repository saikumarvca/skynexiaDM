import * as mongoose from "mongoose";

export interface IWallMessage extends mongoose.Document {
  channelId: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const WallMessageSchema = new mongoose.Schema(
  {
    channelId: { type: String, required: true, index: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: { type: String, required: true },
    body: { type: String, required: true, maxlength: 8000 },
  },
  { timestamps: true },
);

WallMessageSchema.index({ channelId: 1, createdAt: -1 });

const WallMessage =
  (mongoose.models.WallMessage as mongoose.Model<IWallMessage> | undefined) ||
  mongoose.model<IWallMessage>("WallMessage", WallMessageSchema);

export default WallMessage;
