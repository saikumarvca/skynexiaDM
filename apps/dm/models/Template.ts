import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description?: string;
  industry?: string;
  tone?: string;
  platform?: string;
  suggestedCategory?: string;
  suggestedLanguage?: string;
  suggestedRatingStyle?: string;
}

const TemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  industry: { type: String },
  tone: { type: String },
  platform: { type: String },
  suggestedCategory: { type: String },
  suggestedLanguage: { type: String },
  suggestedRatingStyle: { type: String },
}, {
  timestamps: true,
});

TemplateSchema.index({ name: 1 });
TemplateSchema.index({ industry: 1, platform: 1 });

const Template = (mongoose.models.Template as mongoose.Model<ITemplate> | undefined) || mongoose.model<ITemplate>('Template', TemplateSchema);

export default Template;

