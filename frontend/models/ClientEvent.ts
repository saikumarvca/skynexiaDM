import * as mongoose from "mongoose";

/** What kind of record the event is about. */
export type ClientEventEntityType =
  | "REVIEW"
  | "REVIEW_DRAFT"
  | "REVIEW_ALLOCATION"
  | "POSTED_REVIEW"
  | "CLIENT"
  | "SYSTEM"
  | "FEATURE";

/** Coarse "update type" used by the client-facing change log filter. */
export type ClientEventCategory = "REVIEW" | "DATA" | "FEATURE" | "SYSTEM";

export type ClientEventActorRole =
  | "EMPLOYEE"
  | "DEVELOPER"
  | "AGENT"
  | "ADMIN"
  | "SYSTEM";

export type ClientEventVisibility = "INTERNAL" | "CLIENT_VISIBLE";

export type ClientEventSource =
  | "REVIEW_ACTIVITY"
  | "CLIENT_UPDATE"
  | "MANUAL"
  | "SYSTEM";

/**
 * Normalised, client-scoped activity feed. Review-workflow activity is mapped
 * into this collection (see lib/client-portal/events.ts) so the client portal
 * never reads raw ReviewActivityLog documents; each row carries an explicit
 * visibility that internal users can change.
 */
export interface IClientEvent extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  entityType: ClientEventEntityType;
  entityId?: mongoose.Types.ObjectId | null;
  action: string;
  title: string;
  description: string;
  actorUserId?: string | null;
  actorName?: string;
  actorRole: ClientEventActorRole;
  visibility: ClientEventVisibility;
  category: ClientEventCategory;
  source: ClientEventSource;
  /** ReviewActivityLog id this event was derived from (idempotent mapping). */
  sourceLogId?: mongoose.Types.ObjectId | null;
  /** Portal review id (allocation or draft) to link the event to a review. */
  relatedReviewId?: mongoose.Types.ObjectId | null;
  relatedLabel?: string;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClientEventSchema: mongoose.Schema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    entityType: {
      type: String,
      enum: [
        "REVIEW",
        "REVIEW_DRAFT",
        "REVIEW_ALLOCATION",
        "POSTED_REVIEW",
        "CLIENT",
        "SYSTEM",
        "FEATURE",
      ],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    action: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    actorUserId: { type: String, default: null },
    actorName: { type: String },
    actorRole: {
      type: String,
      enum: ["EMPLOYEE", "DEVELOPER", "AGENT", "ADMIN", "SYSTEM"],
      default: "SYSTEM",
    },
    visibility: {
      type: String,
      enum: ["INTERNAL", "CLIENT_VISIBLE"],
      default: "INTERNAL",
    },
    category: {
      type: String,
      enum: ["REVIEW", "DATA", "FEATURE", "SYSTEM"],
      default: "REVIEW",
    },
    source: {
      type: String,
      enum: ["REVIEW_ACTIVITY", "CLIENT_UPDATE", "MANUAL", "SYSTEM"],
      default: "SYSTEM",
    },
    sourceLogId: { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedReviewId: { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedLabel: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Client-facing feeds always filter by client + visibility, newest first.
ClientEventSchema.index({ clientId: 1, visibility: 1, occurredAt: -1 });
ClientEventSchema.index({ clientId: 1, occurredAt: -1 });
ClientEventSchema.index({ clientId: 1, relatedReviewId: 1, occurredAt: -1 });
// One client event per source activity log row per client (idempotent backfill).
ClientEventSchema.index(
  { sourceLogId: 1, clientId: 1 },
  { unique: true, partialFilterExpression: { sourceLogId: { $type: "objectId" } } },
);

const ClientEvent =
  (mongoose.models.ClientEvent as mongoose.Model<IClientEvent> | undefined) ||
  mongoose.model<IClientEvent>("ClientEvent", ClientEventSchema);

export default ClientEvent;
