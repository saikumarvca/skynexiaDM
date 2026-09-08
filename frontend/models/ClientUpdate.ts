import * as mongoose from "mongoose";
import type { ClientEventActorRole } from "@/models/ClientEvent";

export type ClientUpdateCategory =
  | "ANNOUNCEMENT"
  | "PROGRESS"
  | "FEATURE"
  | "MAINTENANCE"
  | "REPORTING";

/**
 * Updates and announcements written by internal staff for one client. Only
 * published, non-deleted updates are ever returned to the client portal.
 */
export interface IClientUpdate extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  category: ClientUpdateCategory;
  postedByUserId: string;
  postedByName: string;
  postedByRole: ClientEventActorRole;
  relatedReviewId?: mongoose.Types.ObjectId | null;
  relatedLabel?: string;
  linkUrl?: string;
  linkLabel?: string;
  /** Visible to the client. Unpublished updates are internal drafts. */
  isPublished: boolean;
  publishedAt?: Date | null;
  /** Client user ids that have opened the update. */
  readByUserIds: string[];
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ClientUpdateSchema: mongoose.Schema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ["ANNOUNCEMENT", "PROGRESS", "FEATURE", "MAINTENANCE", "REPORTING"],
      default: "ANNOUNCEMENT",
    },
    postedByUserId: { type: String, required: true },
    postedByName: { type: String, required: true },
    postedByRole: {
      type: String,
      enum: ["EMPLOYEE", "DEVELOPER", "AGENT", "ADMIN", "SYSTEM"],
      default: "EMPLOYEE",
    },
    relatedReviewId: { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedLabel: { type: String },
    linkUrl: { type: String },
    linkLabel: { type: String },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: null },
    readByUserIds: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ClientUpdateSchema.index({
  clientId: 1,
  isPublished: 1,
  isDeleted: 1,
  publishedAt: -1,
});
ClientUpdateSchema.index({ clientId: 1, createdAt: -1 });

const ClientUpdate =
  (mongoose.models.ClientUpdate as mongoose.Model<IClientUpdate> | undefined) ||
  mongoose.model<IClientUpdate>("ClientUpdate", ClientUpdateSchema);

export default ClientUpdate;
