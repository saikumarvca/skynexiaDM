import * as mongoose from "mongoose";

export interface ICampaignSpendEntry extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  date: Date;
  spend: number;
  impressions?: number;
  clicks?: number;
  source: "MANUAL" | "API_SYNC";
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSpendEntrySchema = new mongoose.Schema<ICampaignSpendEntry>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    date: { type: Date, required: true },
    spend: { type: Number, required: true, default: 0 },
    impressions: { type: Number },
    clicks: { type: Number },
    source: { type: String, enum: ["MANUAL", "API_SYNC"], default: "MANUAL" },
  },
  { timestamps: true },
);

CampaignSpendEntrySchema.index({ campaignId: 1, date: -1 });
CampaignSpendEntrySchema.index({ clientId: 1, date: -1 });

const CampaignSpendEntry =
  (mongoose.models.CampaignSpendEntry as
    | mongoose.Model<ICampaignSpendEntry>
    | undefined) ||
  mongoose.model<ICampaignSpendEntry>(
    "CampaignSpendEntry",
    CampaignSpendEntrySchema,
  );

export default CampaignSpendEntry;
