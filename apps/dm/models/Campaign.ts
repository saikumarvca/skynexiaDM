import * as mongoose from "mongoose";

export type CampaignStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface ICampaignMetrics {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  leads?: number;
  conversions?: number;
  costPerLead?: number;
  conversionRate?: number;
}

export interface ICampaign extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  campaignName: string;
  platform: string;
  objective?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  status: CampaignStatus;
  metrics?: ICampaignMetrics;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: mongoose.Schema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    campaignName: { type: String, required: true },
    platform: { type: String, required: true },
    objective: { type: String },
    budget: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'],
      default: 'PLANNED',
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      leads: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      costPerLead: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ clientId: 1, platform: 1, status: 1 });
CampaignSchema.index({ startDate: 1, endDate: 1 });

const Campaign =
  (mongoose.models.Campaign as mongoose.Model<ICampaign> | undefined) ||
  mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;

