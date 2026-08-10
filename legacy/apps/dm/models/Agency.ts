import * as mongoose from "mongoose";

export type AgencyType = "MAIN" | "PARTNER";
export type AgencyStatus = "ACTIVE" | "INACTIVE";

export interface IAgency extends mongoose.Document {
  name: string;
  type: AgencyType;
  status: AgencyStatus;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AgencySchema: mongoose.Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["MAIN", "PARTNER"], required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AgencySchema.index({ name: 1 }, { unique: true });
AgencySchema.index({ type: 1, status: 1 });
AgencySchema.index({ isDeleted: 1 });

const Agency =
  (mongoose.models.Agency as mongoose.Model<IAgency> | undefined) ||
  mongoose.model<IAgency>("Agency", AgencySchema);

export default Agency;
