import * as mongoose from "mongoose";

export type ReportFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY";

export interface IReportRecipient {
  email: string;
  name: string;
  type: "CLIENT" | "INTERNAL";
}

export interface IReportSchedule extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  name: string;
  sections: string[];
  frequency: ReportFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  sendTime: string;
  timeZone: string;
  recipients: IReportRecipient[];
  isActive: boolean;
  lastSentAt?: Date;
  nextSendAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportScheduleSchema = new mongoose.Schema<IReportSchedule>(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    name: { type: String, required: true },
    sections: [{ type: String }],
    frequency: {
      type: String,
      enum: ["WEEKLY", "MONTHLY", "QUARTERLY"],
      required: true,
    },
    dayOfMonth: { type: Number },
    dayOfWeek: { type: Number },
    sendTime: { type: String, default: "08:00" },
    timeZone: { type: String, default: "UTC" },
    recipients: [
      {
        email: { type: String, required: true },
        name: { type: String },
        type: {
          type: String,
          enum: ["CLIENT", "INTERNAL"],
          default: "INTERNAL",
        },
      },
    ],
    isActive: { type: Boolean, default: true },
    lastSentAt: { type: Date },
    nextSendAt: { type: Date, required: true },
  },
  { timestamps: true },
);

ReportScheduleSchema.index({ clientId: 1 });
ReportScheduleSchema.index({ isActive: 1, nextSendAt: 1 });

const ReportSchedule =
  (mongoose.models.ReportSchedule as
    | mongoose.Model<IReportSchedule>
    | undefined) ||
  mongoose.model<IReportSchedule>("ReportSchedule", ReportScheduleSchema);

export default ReportSchedule;
