import mongoose, { Document, Schema } from 'mongoose';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ITask extends Document {
  clientId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assignedTo?: mongoose.Types.ObjectId | null;
  priority: TaskPriority;
  deadline?: Date;
  status: TaskStatus;
  createdBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'],
      default: 'TODO',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ clientId: 1, status: 1, priority: 1, deadline: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });

const Task =
  (mongoose.models.Task as mongoose.Model<ITask> | undefined) ||
  mongoose.model<ITask>('Task', TaskSchema);

export default Task;

