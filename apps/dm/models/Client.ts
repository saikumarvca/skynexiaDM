import * as mongoose from "mongoose";

export interface IClient extends mongoose.Document {
  name: string;
  businessName: string;
  brandName: string;
  contactName: string;
  phone: string;
  email: string;
  notes?: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  website?: string;
  industry?: string;
  location?: string;
  marketingChannels?: string[];
  contractStart?: Date;
  contractEnd?: Date;
  monthlyBudget?: number;
  assignedManagerId?: string | null;
  reviewDestinationUrl?: string;
  reviewQrImageUrl?: string;
  reviewDestinations?: {
    platform: string;
    reviewDestinationUrl?: string;
    reviewQrImageUrl?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: mongoose.Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    businessName: { type: String, required: true },
    brandName: { type: String, required: true },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
    },
    website: { type: String },
    industry: { type: String },
    location: { type: String },
    marketingChannels: [{ type: String }],
    contractStart: { type: Date },
    contractEnd: { type: Date },
    monthlyBudget: { type: Number },
    assignedManagerId: { type: String, default: null },
    reviewDestinationUrl: { type: String },
    reviewQrImageUrl: { type: String },
    reviewDestinations: [
      {
        platform: { type: String, required: true },
        reviewDestinationUrl: { type: String },
        reviewQrImageUrl: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Add indexes for better query performance
ClientSchema.index({ status: 1, createdAt: -1 });
ClientSchema.index({ email: 1 }, { unique: true });
ClientSchema.index({ name: 1 });
ClientSchema.index({ businessName: 1 });
ClientSchema.index({ status: 1, industry: 1 });

// Prevent model overwrite during hot reload in development
const Client =
  (mongoose.models.Client as mongoose.Model<IClient> | undefined) ||
  mongoose.model<IClient>("Client", ClientSchema);

export default Client;
