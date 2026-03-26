import * as mongoose from "mongoose";

export interface IKeywordHistoryEntry {
  date: Date;
  rank: number;
}

export interface IKeyword extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  rank?: number;
  targetUrl?: string;
  competitorUrls?: string[];
  lastUpdated?: Date;
  history?: IKeywordHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const KeywordSchema: mongoose.Schema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    keyword: { type: String, required: true },
    searchVolume: { type: Number },
    difficulty: { type: Number },
    rank: { type: Number },
    targetUrl: { type: String },
    competitorUrls: [{ type: String }],
    lastUpdated: { type: Date },
    history: [
      {
        date: { type: Date, required: true },
        rank: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

KeywordSchema.index({ clientId: 1, keyword: 1 }, { unique: true });
KeywordSchema.index({ clientId: 1, rank: 1 });
KeywordSchema.index({ clientId: 1, difficulty: 1 });

const Keyword =
  (mongoose.models.Keyword as mongoose.Model<IKeyword> | undefined) ||
  mongoose.model<IKeyword>('Keyword', KeywordSchema);

export default Keyword;

