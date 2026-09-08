/**
 * Idempotent bootstrap for the VR Filings client login.
 *
 * Resolves the existing "VR Filings" client record (never creates one), then
 * creates or updates the CLIENT user linked to it. The password is read from
 * the environment and stored only as a bcrypt hash; it is never printed.
 *
 *   VR_CLIENT_PASSWORD='...' node scripts/seed-vr-filings-client.mjs
 *
 * Environment:
 *   MONGODB_URI            connection string (falls back to .env.local / .env)
 *   VR_CLIENT_PASSWORD     password to set. Required on first run; on later
 *                          runs the existing hash is kept unless it is set.
 *   VR_CLIENT_EMAIL        defaults to client@vrfilings.in
 *   VR_CLIENT_NAME         optional; client name to match (default "VR Filings")
 *   VR_CLIENT_ID           optional; exact client id (skips name matching)
 *
 * Fails with a clear message when the client cannot be resolved uniquely.
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
  process.exit(1);
}

/** Case/whitespace-insensitive equality, so "VR Filings" == "vrfilings". */
function normalize(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

loadDotEnvIfNeeded();

const MONGODB_URI = process.env.MONGODB_URI;
const email = (process.env.VR_CLIENT_EMAIL || "client@vrfilings.in").trim().toLowerCase();
const password = process.env.VR_CLIENT_PASSWORD || "";
const clientNameArg = (process.env.VR_CLIENT_NAME || "VR Filings").trim();
const clientIdArg = (process.env.VR_CLIENT_ID || "").trim();

if (!MONGODB_URI) fail("MONGODB_URI is not set and no .env/.env.local was found.");
if (password && password.length < 8) fail("VR_CLIENT_PASSWORD must be at least 8 characters.");

const ClientSchema = new mongoose.Schema(
  { name: String, businessName: String, brandName: String, email: String, status: String },
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

// ── Resolve the client (must be exactly one) ───────────────────────────────
let client = null;
if (clientIdArg) {
  if (!mongoose.isValidObjectId(clientIdArg)) {
    await mongoose.disconnect();
    fail(`VR_CLIENT_ID "${clientIdArg}" is not a valid id.`);
  }
  client = await Client.findById(clientIdArg).lean();
  if (!client) {
    await mongoose.disconnect();
    fail(`No client with id ${clientIdArg} in database "${dbName}".`);
  }
} else {
  const wanted = normalize(clientNameArg);
  const all = await Client.find({})
    .select("name businessName brandName email status")
    .lean();
  const matches = all.filter(
    (c) =>
      normalize(c.name) === wanted ||
      normalize(c.businessName) === wanted ||
      normalize(c.brandName) === wanted,
  );
  if (matches.length === 0) {
    await mongoose.disconnect();
    fail(
      `No client named "${clientNameArg}" exists in database "${dbName}". Create the client first; this script never creates clients.`,
    );
  }
  if (matches.length > 1) {
    console.error(`\n✗ "${clientNameArg}" matches ${matches.length} clients. Re-run with VR_CLIENT_ID=<id>:`);
    for (const m of matches) {
      console.error(`   ${m._id}  ${m.name} — ${m.businessName} (${m.email}, ${m.status})`);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
  client = matches[0];
}

// ── Create or update the CLIENT login ─────────────────────────────────────
const existing = await User.findOne({ email }).select("_id role clientId passwordHash").lean();
if (existing && existing.role !== "CLIENT") {
  await mongoose.disconnect();
  fail(`${email} already exists with role ${existing.role}; refusing to convert an internal account.`);
}
if (!existing && !password) {
  await mongoose.disconnect();
  fail("VR_CLIENT_PASSWORD is required when creating the login for the first time.");
}

const $set = {
  email,
  name: client.businessName || client.name || "VR Filings",
  role: "CLIENT",
  clientId: client._id,
  isActive: true,
};
if (password) $set.passwordHash = await bcrypt.hash(password, 12);

const user = await User.findOneAndUpdate({ email }, { $set }, { upsert: true, new: true })
  .select("_id email name role clientId")
  .lean();

console.log(`\n✓ VR Filings client login ready in database "${dbName}"`);
console.log(`   Email:    ${user.email}`);
console.log(`   Name:     ${user.name}`);
console.log(`   Client:   ${client.name} — ${client.businessName} (${client._id})`);
console.log(`   Password: ${password ? (existing ? "updated" : "set") : "unchanged"}`);
console.log(`\n   Sign in at /client/login\n`);

await mongoose.disconnect();
