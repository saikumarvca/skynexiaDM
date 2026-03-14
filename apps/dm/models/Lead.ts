import mongoose, { Document, Schema } from 'mongoose';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export interface ILead extends Document {
  clientId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  campaignId?: mongoose.Types.ObjectId | null;
  status: LeadStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    source: { type: String },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED_WON', 'CLOSED_LOST'],
      default: 'NEW',
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

LeadSchema.index({ clientId: 1, status: 1, createdAt: -1 });
LeadSchema.index({ campaignId: 1 });
LeadSchema.index({ source: 1 });

const Lead =
  (mongoose.models.Lead as mongoose.Model<ILead> | undefined) ||
  mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;

