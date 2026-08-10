import * as mongoose from "mongoose";

export type PartnerAgencyStatus = "ACTIVE" | "INACTIVE";

export interface IPartnerAgency extends mongoose.Document {
  name: string;
  code?: string;
  status: PartnerAgencyStatus;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerAgencySchema: mongoose.Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    contactName: { type: String },
    contactEmail: { type: String },
    phone: { type: String },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

PartnerAgencySchema.index({ name: 1 }, { unique: true });
PartnerAgencySchema.index({ code: 1 }, { unique: true, sparse: true });
PartnerAgencySchema.index({ status: 1 });
PartnerAgencySchema.index({ isDeleted: 1 });

const PartnerAgency =
  (mongoose.models.PartnerAgency as
    | mongoose.Model<IPartnerAgency>
    | undefined) ||
  mongoose.model<IPartnerAgency>("PartnerAgency", PartnerAgencySchema);

export default PartnerAgency;
