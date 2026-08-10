import * as mongoose from "mongoose";

export type SavedFilterEntityType = "lead" | "task" | "content";

export interface ISavedFilter extends mongoose.Document {
  name: string;
  entityType: SavedFilterEntityType;
  filters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SavedFilterSchema: mongoose.Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    entityType: {
      type: String,
      enum: ["lead", "task", "content"],
      required: true,
    },
    filters: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  },
);

SavedFilterSchema.index({ entityType: 1, createdAt: -1 });

const SavedFilter =
  (mongoose.models.SavedFilter as mongoose.Model<ISavedFilter> | undefined) ||
  mongoose.model<ISavedFilter>("SavedFilter", SavedFilterSchema);

export default SavedFilter;
