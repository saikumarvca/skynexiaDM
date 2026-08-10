import * as mongoose from "mongoose";

export type TeamMemberStatus = "Active" | "Inactive";
export type TeamMemberAccountType =
  | "MAIN_EMPLOYEE"
  | "PARTNER_AGENCY"
  | "PARTNER_EMPLOYEE";

export interface ITeamMember extends mongoose.Document {
  name: string;
  email: string;
  phone?: string;
  roleId?: mongoose.Types.ObjectId;
  roleName?: string;
  department?: string;
  avatarUrl?: string;
  userId?: string;
  agencyId?: mongoose.Types.ObjectId | null;
  memberScopeType?: "MAIN" | "PARTNER";
  isPartnerEmployee?: boolean;
  accountType?: TeamMemberAccountType;
  partnerAgencyId?: mongoose.Types.ObjectId | null;
  reportsToUserId?: string;
  assignedClientIds: mongoose.Types.ObjectId[];
  assignedClientNamesSnapshot?: string[];
  status: TeamMemberStatus;
  notes?: string;
  joinedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema: mongoose.Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "TeamRole" },
    roleName: { type: String },
    department: { type: String },
    avatarUrl: { type: String },
    userId: { type: String },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      default: null,
    },
    memberScopeType: {
      type: String,
      enum: ["MAIN", "PARTNER"],
      default: "MAIN",
    },
    isPartnerEmployee: { type: Boolean, default: false },
    accountType: {
      type: String,
      enum: ["MAIN_EMPLOYEE", "PARTNER_AGENCY", "PARTNER_EMPLOYEE"],
      default: "MAIN_EMPLOYEE",
    },
    partnerAgencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerAgency",
      default: null,
    },
    reportsToUserId: { type: String },
    assignedClientIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Client" }],
      default: [],
    },
    assignedClientNamesSnapshot: [{ type: String }],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    notes: { type: String },
    joinedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TeamMemberSchema.index({ email: 1 }, { unique: true, sparse: true });
TeamMemberSchema.index({ agencyId: 1, email: 1 }, { sparse: true });
TeamMemberSchema.index({ roleId: 1 });
TeamMemberSchema.index({ status: 1 });
TeamMemberSchema.index({ department: 1 });
TeamMemberSchema.index({ isDeleted: 1 });
TeamMemberSchema.index({ agencyId: 1, isDeleted: 1 });
TeamMemberSchema.index({ accountType: 1, partnerAgencyId: 1 });
TeamMemberSchema.index({ reportsToUserId: 1 });

const TeamMember =
  (mongoose.models.TeamMember as mongoose.Model<ITeamMember> | undefined) ||
  mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);

export default TeamMember;
