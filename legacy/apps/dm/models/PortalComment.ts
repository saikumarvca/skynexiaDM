import * as mongoose from "mongoose";

export interface IPortalComment extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  authorType: "AGENCY" | "CLIENT";
  authorName: string;
  body: string;
  createdAt: Date;
}

const PortalCommentSchema = new mongoose.Schema<IPortalComment>(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    authorType: { type: String, enum: ["AGENCY", "CLIENT"], required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

PortalCommentSchema.index({ entityId: 1, entityType: 1 });
PortalCommentSchema.index({ clientId: 1, createdAt: -1 });

const PortalComment =
  (mongoose.models.PortalComment as
    | mongoose.Model<IPortalComment>
    | undefined) ||
  mongoose.model<IPortalComment>("PortalComment", PortalCommentSchema);

export default PortalComment;
