import * as mongoose from "mongoose";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export interface ILead extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  campaignId?: mongoose.Types.ObjectId | null;
  status: LeadStatus;
  notes?: string;
  assignedTo?: mongoose.Types.ObjectId;
  estimatedValue?: number;
  score?: number;
  nextFollowUpAt?: Date;
  lostReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: mongoose.Schema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    source: { type: String },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "QUALIFIED", "CLOSED_WON", "CLOSED_LOST"],
      default: "NEW",
    },
    notes: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "TeamMember" },
    estimatedValue: { type: Number },
    score: { type: Number, default: 0 },
    nextFollowUpAt: { type: Date },
    lostReason: { type: String },
  },
  {
    timestamps: true,
  },
);

LeadSchema.index({ clientId: 1, status: 1, createdAt: -1 });
LeadSchema.index({ campaignId: 1 });
LeadSchema.index({ source: 1 });

const Lead =
  (mongoose.models.Lead as mongoose.Model<ILead> | undefined) ||
  mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
