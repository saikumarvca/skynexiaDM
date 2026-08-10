import * as mongoose from "mongoose";

export interface IItemMaster extends mongoose.Document {
  name: string;
  description: string;
  defaultUnitPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemMasterSchema = new mongoose.Schema<IItemMaster>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    defaultUnitPrice: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ItemMasterSchema.index({ name: 1 });
ItemMasterSchema.index({ isActive: 1 });

const ItemMaster =
  (mongoose.models.ItemMaster as mongoose.Model<IItemMaster> | undefined) ||
  mongoose.model<IItemMaster>("ItemMaster", ItemMasterSchema);

export default ItemMaster;
