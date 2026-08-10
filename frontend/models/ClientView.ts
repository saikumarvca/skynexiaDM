import * as mongoose from "mongoose";

export interface IClientView extends mongoose.Document {
  name: string;
  ownerId?: string | null;
  filters: Record<string, unknown>;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientViewSchema: mongoose.Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: String, default: null },
    filters: { type: mongoose.Schema.Types.Mixed, required: true },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

ClientViewSchema.index({ ownerId: 1, createdAt: -1 });

const ClientView =
  (mongoose.models.ClientView as mongoose.Model<IClientView> | undefined) ||
  mongoose.model<IClientView>("ClientView", ClientViewSchema);

export default ClientView;
