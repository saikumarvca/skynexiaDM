import * as mongoose from "mongoose";

export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'CONTENT_WRITER'
  | 'DESIGNER'
  | 'ANALYST';

export interface IUser extends mongoose.Document {
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: mongoose.Schema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'CONTENT_WRITER', 'DESIGNER', 'ANALYST'],
      default: 'MANAGER',
    },
    passwordHash: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// email index is created by unique: true above; avoid duplicate
UserSchema.index({ role: 1, isActive: 1 });

const User =
  (mongoose.models.User as mongoose.Model<IUser> | undefined) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;

