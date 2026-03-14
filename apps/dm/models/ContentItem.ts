import mongoose, { Document, Schema } from 'mongoose';

export type ContentCategory =
  | 'CAPTION'
  | 'HASHTAGS'
  | 'AD_COPY'
  | 'CTA'
  | 'HOOK'
  | 'OTHER';

export interface IContentItem extends Document {
  clientId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  platform?: string;
  category: ContentCategory;
  tags?: string[];
  createdBy?: mongoose.Types.ObjectId | null;
  status: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  source: 'MANUAL' | 'AI' | 'IMPORT';
  createdAt: Date;
  updatedAt: Date;
}

const ContentItemSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    platform: { type: String },
    category: {
      type: String,
      enum: ['CAPTION', 'HASHTAGS', 'AD_COPY', 'CTA', 'HOOK', 'OTHER'],
      required: true,
    },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    source: {
      type: String,
      enum: ['MANUAL', 'AI', 'IMPORT'],
      default: 'MANUAL',
    },
  },
  {
    timestamps: true,
  }
);

ContentItemSchema.index({ clientId: 1, category: 1, status: 1, createdAt: -1 });
ContentItemSchema.index({ tags: 1 });

const ContentItem =
  (mongoose.models.ContentItem as mongoose.Model<IContentItem> | undefined) ||
  mongoose.model<IContentItem>('ContentItem', ContentItemSchema);

export default ContentItem;

