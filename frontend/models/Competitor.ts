import * as mongoose from "mongoose";

export interface ICompetitor extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  domain: string;
  name: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorSchema = new mongoose.Schema<ICompetitor>(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    domain: { type: String, required: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true },
);

CompetitorSchema.index({ clientId: 1, domain: 1 }, { unique: true });

const Competitor =
  (mongoose.models.Competitor as mongoose.Model<ICompetitor> | undefined) ||
  mongoose.model<ICompetitor>("Competitor", CompetitorSchema);

export default Competitor;
