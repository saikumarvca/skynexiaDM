import * as mongoose from "mongoose";

export interface IIntegrationEvent extends mongoose.Document {
  integrationId: mongoose.Types.ObjectId;
  receivedAt: Date;
  payload: Record<string, unknown>;
  status: "PROCESSED" | "FAILED" | "IGNORED";
  resultEntityId?: mongoose.Types.ObjectId;
  errorMessage?: string;
}

const IntegrationEventSchema = new mongoose.Schema<IIntegrationEvent>(
  {
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Integration",
      required: true,
    },
    receivedAt: { type: Date, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["PROCESSED", "FAILED", "IGNORED"],
      required: true,
    },
    resultEntityId: { type: mongoose.Schema.Types.ObjectId },
    errorMessage: { type: String },
  },
  { timestamps: false },
);

IntegrationEventSchema.index({ integrationId: 1, receivedAt: -1 });

const IntegrationEvent =
  (mongoose.models.IntegrationEvent as
    | mongoose.Model<IIntegrationEvent>
    | undefined) ||
  mongoose.model<IIntegrationEvent>("IntegrationEvent", IntegrationEventSchema);

export default IntegrationEvent;
