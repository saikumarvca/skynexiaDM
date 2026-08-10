/**
 * Creates or updates a dashboard login user in MongoDB.
 *
 * Local (default): uses mongodb://localhost:27017/dm
 * Production: point at the SAME database as dm.db2.in:
 *
 *   pnpm exec node scripts/seed-user.mjs
 *   # or, from apps/dm with production URI (use your host’s shell syntax):
 *   $env:MONGODB_URI="mongodb+srv://..."; $env:SEED_PASSWORD="YourStrongPassword"; node scripts/seed-user.mjs
 *
 * Never commit real production URIs or passwords to git.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dm";
const email = (process.env.SEED_EMAIL || "admin@skynexia.com").trim().toLowerCase();
const password = process.env.SEED_PASSWORD || "admin123";

if (!process.env.MONGODB_URI) {
  console.warn(
    "[seed-user] Using default MONGODB_URI (localhost). For dm.db2.in, set MONGODB_URI to your server’s Mongo connection string.\n"
  );
}

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "CONTENT_WRITER", "DESIGNER", "ANALYST"],
      default: "MANAGER",
    },
    passwordHash: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

await mongoose.connect(MONGODB_URI);

const passwordHash = await bcrypt.hash(password, 10);

await User.findOneAndUpdate(
  { email },
  { email, name: "Admin", role: "ADMIN", passwordHash, isActive: true },
  { upsert: true, new: true }
);

console.log(`✓ User upserted: ${email}`);
console.log("  Log in with that email and the password you set (SEED_PASSWORD or default for local only).");
await mongoose.disconnect();
