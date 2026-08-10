import * as mongoose from "mongoose";

export interface IReportSendLog extends mongoose.Document {
  reportScheduleId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  sentAt: Date;
  recipients: string[];
  status: "SUCCESS" | "FAILED";
  errorMessage?: string;
}

const ReportSendLogSchema = new mongoose.Schema<IReportSendLog>(
  {
    reportScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReportSchedule",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    sentAt: { type: Date, required: true },
    recipients: [{ type: String }],
    status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
    errorMessage: { type: String },
  },
  { timestamps: false },
);

ReportSendLogSchema.index({ reportScheduleId: 1, sentAt: -1 });
ReportSendLogSchema.index({ clientId: 1, sentAt: -1 });

const ReportSendLog =
  (mongoose.models.ReportSendLog as
    | mongoose.Model<IReportSendLog>
    | undefined) ||
  mongoose.model<IReportSendLog>("ReportSendLog", ReportSendLogSchema);

export default ReportSendLog;
