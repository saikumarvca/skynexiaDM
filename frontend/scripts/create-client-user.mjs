/**
 * Create (or reset) an external CLIENT login: a user who can only open the
 * client portal for one client (review progress + statistics).
 *
 * Run from the frontend directory. MONGODB_URI is read from the environment,
 * or from .env.local / .env in the current directory when not set.
 *
 *   CLIENT_EMAIL=client@example.com \
 *   CLIENT_PASSWORD='...' \
 *   CLIENT_MATCH=vrfilings \
 *   node scripts/create-client-user.mjs
 *
 * Selecting the client (one of):
 *   CLIENT_ID=<mongo id>          exact client id
 *   CLIENT_MATCH=<text>           case-insensitive match on client name,
 *                                 business name, brand name, or email
 * Optional:
 *   CLIENT_USER_NAME="Display name"   defaults to the client's business name
 *
 * The password is never printed. Re-running with the same email updates the
 * password, display name and linked client.
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

function loadDotEnvIfNeeded() {
  if (process.env.MONGODB_URI) return;
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const [, key, rawValue] = m;
      if (process.env[key]) continue;
      let value = rawValue;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  console.error(
    "Usage: CLIENT_EMAIL=... CLIENT_PASSWORD=... (CLIENT_ID=... | CLIENT_MATCH=...) [CLIENT_USER_NAME=...] node scripts/create-client-user.mjs",
  );
  process.exit(1);
}

loadDotEnvIfNeeded();

const MONGODB_URI = process.env.MONGODB_URI;
const email = (process.env.CLIENT_EMAIL || "").trim().toLowerCase();
const password = process.env.CLIENT_PASSWORD || "";
const clientIdArg = (process.env.CLIENT_ID || "").trim();
const clientMatch = (process.env.CLIENT_MATCH || "").trim();
const displayNameArg = (process.env.CLIENT_USER_NAME || "").trim();

if (!MONGODB_URI) fail("MONGODB_URI is not set and no .env/.env.local was found.");
if (!email || !email.includes("@")) fail("CLIENT_EMAIL is required.");
if (password.length < 8) fail("CLIENT_PASSWORD is required (min 8 characters).");
if (!clientIdArg && !clientMatch) fail("Set CLIENT_ID or CLIENT_MATCH to pick the client.");

const ClientSchema = new mongoose.Schema(
  {
    name: String,
    businessName: String,
    brandName: String,
    email: String,
    status: String,
  },
  { strict: false },
);
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, default: "MANAGER" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null },
    passwordHash: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false },
);
const Client = mongoose.models.Client || mongoose.model("Client", ClientSchema, "clients");
const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");

await mongoose.connect(MONGODB_URI);
const dbName = mongoose.connection.db?.databaseName;

let client = null;
if (clientIdArg) {
  if (!mongoose.isValidObjectId(clientIdArg)) {
    await mongoose.disconnect();
    fail(`CLIENT_ID "${clientIdArg}" is not a valid id.`);
  }
  client = await Client.findById(clientIdArg).lean();
  if (!client) {
    await mongoose.disconnect();
    fail(`No client with id ${clientIdArg} in database "${dbName}".`);
  }
} else {
  const escaped = clientMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Allow "vrfilings" to match "VR Filings" by ignoring spaces on both sides.
  const loose = escaped.split("").join("\\s*");
  const rx = new RegExp(loose, "i");
  const matches = await Client.find({
    $or: [{ name: rx }, { businessName: rx }, { brandName: rx }, { email: rx }],
  })
    .select("name businessName brandName email status")
    .lean();
  if (matches.length === 0) {
    await mongoose.disconnect();
    fail(`No client matches "${clientMatch}" in database "${dbName}".`);
  }
  if (matches.length > 1) {
    console.error(`\n✗ "${clientMatch}" matches ${matches.length} clients. Re-run with CLIENT_ID=<id>:`);
    for (const m of matches) {
      console.error(`   ${m._id}  ${m.name} — ${m.businessName} (${m.email}, ${m.status})`);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
  client = matches[0];
}

const displayName =
  displayNameArg || client.businessName || client.name || "Client";
const passwordHash = await bcrypt.hash(password, 12);

const user = await User.findOneAndUpdate(
  { email },
  {
    $set: {
      email,
      name: displayName,
      role: "CLIENT",
      clientId: client._id,
      passwordHash,
      isActive: true,
    },
  },
  { upsert: true, new: true },
).lean();

console.log(`\n✓ Client login ready in database "${dbName}"`);
console.log(`   Email:   ${user.email}`);
console.log(`   Name:    ${user.name}`);
console.log(`   Role:    ${user.role}`);
console.log(`   Client:  ${client.name} — ${client.businessName} (${client._id})`);
console.log(`\n   Sign in at /login; the account is taken straight to /client-portal.\n`);

await mongoose.disconnect();
