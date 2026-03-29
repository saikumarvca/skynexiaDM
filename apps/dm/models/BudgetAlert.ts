import * as mongoose from "mongoose";

export interface IBudgetAlert extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  threshold: number;
  spendToDate: number;
  budget: number;
  triggeredAt: Date;
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
}

const BudgetAlertSchema = new mongoose.Schema<IBudgetAlert>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    threshold: { type: Number, required: true },
    spendToDate: { type: Number, required: true },
    budget: { type: Number, required: true },
    triggeredAt: { type: Date, required: true },
    isAcknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
  },
  { timestamps: false },
);

BudgetAlertSchema.index({ campaignId: 1, threshold: 1, triggeredAt: -1 });
BudgetAlertSchema.index({ clientId: 1, isAcknowledged: 1 });

const BudgetAlert =
  (mongoose.models.BudgetAlert as mongoose.Model<IBudgetAlert> | undefined) ||
  mongoose.model<IBudgetAlert>("BudgetAlert", BudgetAlertSchema);

export default BudgetAlert;
