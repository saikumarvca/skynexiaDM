import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  name: string;
  businessName: string;
  brandName: string;
  contactName: string;
  phone: string;
  email: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  businessName: { type: String, required: true },
  brandName: { type: String, required: true },
  contactName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
    default: 'ACTIVE'
  },
}, {
  timestamps: true,
});

// Prevent model overwrite during hot reload
const Client = mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export default Client;