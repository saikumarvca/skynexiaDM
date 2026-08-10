import * as mongoose from "mongoose";

export type IntegrationType =
  | "FACEBOOK_LEADS"
  | "GOOGLE_ADS"
  | "TYPEFORM"
  | "GENERIC_WEBHOOK";

export interface IFieldMapping {
  sourceField: string;
  targetField: string;
  targetModel: string;
}

export interface IIntegration extends mongoose.Document {
  name: string;
  type: IntegrationType;
  clientId?: mongoose.Types.ObjectId;
  apiKey: string;
  config: Record<string, unknown>;
  fieldMappings: IFieldMapping[];
  isActive: boolean;
  lastReceivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new mongoose.Schema<IIntegration>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["FACEBOOK_LEADS", "GOOGLE_ADS", "TYPEFORM", "GENERIC_WEBHOOK"],
      required: true,
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    apiKey: { type: String, required: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    fieldMappings: [
      {
        sourceField: { type: String, required: true },
        targetField: { type: String, required: true },
        targetModel: { type: String, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
    lastReceivedAt: { type: Date },
  },
  { timestamps: true },
);

IntegrationSchema.index({ apiKey: 1 }, { unique: true });
IntegrationSchema.index({ clientId: 1 });

const Integration =
  (mongoose.models.Integration as mongoose.Model<IIntegration> | undefined) ||
  mongoose.model<IIntegration>("Integration", IntegrationSchema);

export default Integration;
