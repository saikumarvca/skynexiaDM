import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = "mongodb://localhost:27017/dm";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "MANAGER", "CONTENT_WRITER", "DESIGNER", "ANALYST"], default: "MANAGER" },
    passwordHash: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

await mongoose.connect(MONGODB_URI);

const email = "admin@skynexia.com";
const password = "admin123";
const passwordHash = await bcrypt.hash(password, 10);

await User.findOneAndUpdate(
  { email },
  { email, name: "Admin", role: "ADMIN", passwordHash, isActive: true },
  { upsert: true, new: true }
);

console.log(`✓ User seeded: ${email} / ${password}`);
await mongoose.disconnect();
