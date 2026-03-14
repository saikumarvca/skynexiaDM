import mongoose, { Document, Schema } from 'mongoose';

export interface IClientView extends Document {
  name: string;
  ownerId?: string | null;
  filters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ClientViewSchema: Schema = new Schema({
  name: { type: String, required: true },
  ownerId: { type: String, default: null },
  filters: { type: Schema.Types.Mixed, required: true },
}, {
  timestamps: true,
});

ClientViewSchema.index({ ownerId: 1, createdAt: -1 });

const ClientView = (mongoose.models.ClientView as mongoose.Model<IClientView> | undefined) || mongoose.model<IClientView>('ClientView', ClientViewSchema);

export default ClientView;

