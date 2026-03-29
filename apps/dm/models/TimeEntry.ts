import * as mongoose from "mongoose";

export interface ITimeEntry extends mongoose.Document {
  userId: string;
  clientId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  date: Date;
  durationMinutes: number;
  description: string;
  isBillable: boolean;
  hourlyRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new mongoose.Schema<ITimeEntry>(
  {
    userId: { type: String, required: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    description: { type: String, required: true },
    isBillable: { type: Boolean, default: true },
    hourlyRate: { type: Number },
  },
  { timestamps: true },
);

TimeEntrySchema.index({ userId: 1, date: -1 });
TimeEntrySchema.index({ clientId: 1, date: -1 });
TimeEntrySchema.index({ taskId: 1 });

const TimeEntry =
  (mongoose.models.TimeEntry as mongoose.Model<ITimeEntry> | undefined) ||
  mongoose.model<ITimeEntry>("TimeEntry", TimeEntrySchema);

export default TimeEntry;
