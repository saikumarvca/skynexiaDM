import * as mongoose from "mongoose";

export interface ICompetitorRankEntry {
  date: Date;
  rank: number;
}

export interface ICompetitorKeywordRank extends mongoose.Document {
  competitorId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  keyword: string;
  rank?: number;
  checkedAt?: Date;
  history: ICompetitorRankEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorKeywordRankSchema = new mongoose.Schema<ICompetitorKeywordRank>(
  {
    competitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competitor",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    keyword: { type: String, required: true },
    rank: { type: Number },
    checkedAt: { type: Date },
    history: [
      {
        date: { type: Date, required: true },
        rank: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true },
);

CompetitorKeywordRankSchema.index({ competitorId: 1, keyword: 1 });
CompetitorKeywordRankSchema.index({ clientId: 1, keyword: 1 });

const CompetitorKeywordRank =
  (mongoose.models.CompetitorKeywordRank as
    | mongoose.Model<ICompetitorKeywordRank>
    | undefined) ||
  mongoose.model<ICompetitorKeywordRank>(
    "CompetitorKeywordRank",
    CompetitorKeywordRankSchema,
  );

export default CompetitorKeywordRank;
