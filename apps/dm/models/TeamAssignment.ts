import * as mongoose from "mongoose";

export type AssignmentType =
  | "review"
  | "lead"
  | "task"
  | "campaign"
  | "client"
  | "other";

export type SourceModule =
  | "reviews"
  | "leads"
  | "tasks"
  | "campaigns"
  | "clients";

export type AssignmentStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type AssignmentPriority = "Low" | "Medium" | "High" | "Urgent";

export interface ITeamAssignment extends mongoose.Document {
  title: string;
  description?: string;
  assignmentType: AssignmentType;
  sourceModule?: SourceModule;
  referenceId?: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedByUserId: string;
  assignedByUserName: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeamAssignmentSchema: mongoose.Schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignmentType: {
      type: String,
      enum: ["review", "lead", "task", "campaign", "client", "other"],
      required: true,
    },
    sourceModule: {
      type: String,
      enum: ["reviews", "leads", "tasks", "campaigns", "clients"],
    },
    referenceId: { type: String },
    assignedToUserId: { type: String, required: true },
    assignedToUserName: { type: String, required: true },
    assignedByUserId: { type: String, required: true },
    assignedByUserName: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TeamAssignmentSchema.index({ assignedToUserId: 1 });
TeamAssignmentSchema.index({ assignmentType: 1 });
TeamAssignmentSchema.index({ status: 1 });
TeamAssignmentSchema.index({ referenceId: 1 });
TeamAssignmentSchema.index({ createdAt: -1 });
TeamAssignmentSchema.index({ isDeleted: 1 });

const TeamAssignment =
  (mongoose.models.TeamAssignment as
    | mongoose.Model<ITeamAssignment>
    | undefined) ||
  mongoose.model<ITeamAssignment>("TeamAssignment", TeamAssignmentSchema);

export default TeamAssignment;
