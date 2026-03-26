import * as mongoose from "mongoose";

export interface ITeamActivityLog extends mongoose.Document {
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  targetName?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const TeamActivityLogSchema: mongoose.Schema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    targetName: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

TeamActivityLogSchema.index({ userId: 1 });
TeamActivityLogSchema.index({ module: 1 });
TeamActivityLogSchema.index({ createdAt: -1 });

const TeamActivityLog =
  (mongoose.models.TeamActivityLog as mongoose.Model<ITeamActivityLog> | undefined) ||
  mongoose.model<ITeamActivityLog>('TeamActivityLog', TeamActivityLogSchema);

export default TeamActivityLog;
