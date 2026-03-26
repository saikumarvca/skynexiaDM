import * as mongoose from "mongoose";

export type FileCategory =
  | 'LOGO'
  | 'IMAGE'
  | 'VIDEO'
  | 'BANNER'
  | 'CREATIVE'
  | 'DOC'
  | 'OTHER';

export interface IFileAsset extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  url: string;
  size?: number;
  category: FileCategory;
  tags?: string[];
  uploadedBy?: mongoose.Types.ObjectId | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FileAssetSchema: mongoose.Schema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number },
    category: {
      type: String,
      enum: ['LOGO', 'IMAGE', 'VIDEO', 'BANNER', 'CREATIVE', 'DOC', 'OTHER'],
      default: 'OTHER',
    },
    tags: [{ type: String }],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

FileAssetSchema.index({ clientId: 1, category: 1, uploadedAt: -1 });
FileAssetSchema.index({ tags: 1 });

const FileAsset =
  (mongoose.models.FileAsset as mongoose.Model<IFileAsset> | undefined) ||
  mongoose.model<IFileAsset>('FileAsset', FileAssetSchema);

export default FileAsset;

