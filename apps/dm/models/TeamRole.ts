import * as mongoose from "mongoose";

export interface ITeamRole extends mongoose.Document {
  roleName: string;
  description?: string;
  permissions: string[];
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeamRoleSchema: mongoose.Schema = new mongoose.Schema(
  {
    roleName: { type: String, required: true },
    description: { type: String },
    permissions: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TeamRoleSchema.index({ roleName: 1 }, { unique: true });
TeamRoleSchema.index({ isDeleted: 1 });

const TeamRole =
  (mongoose.models.TeamRole as mongoose.Model<ITeamRole> | undefined) ||
  mongoose.model<ITeamRole>("TeamRole", TeamRoleSchema);

export default TeamRole;
