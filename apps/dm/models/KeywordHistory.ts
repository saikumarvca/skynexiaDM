import * as mongoose from 'mongoose';

export interface IKeywordHistory extends mongoose.Document {
  keywordId: mongoose.Types.ObjectId;
  rank: number;
  searchVolume?: number;
  recordedAt: Date;
}

const KeywordHistorySchema: mongoose.Schema = new mongoose.Schema(
  {
    keywordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Keyword',
      required: true,
    },
    rank: { type: Number, required: true },
    searchVolume: { type: Number },
    recordedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: false,
  }
);

KeywordHistorySchema.index({ keywordId: 1, recordedAt: -1 });

const KeywordHistory =
  (mongoose.models.KeywordHistory as mongoose.Model<IKeywordHistory> | undefined) ||
  mongoose.model<IKeywordHistory>('KeywordHistory', KeywordHistorySchema);

export default KeywordHistory;
