/**
 * One-time, idempotent backfill for agency hierarchy fields.
 *
 * Usage:
 *   node scripts/backfill-agency-hierarchy.mjs
 *   $env:MONGODB_URI="mongodb+srv://..."; node scripts/backfill-agency-hierarchy.mjs
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dm";
const MAIN_AGENCY_NAME = (process.env.MAIN_AGENCY_NAME || "Main Agency").trim();

if (!process.env.MONGODB_URI) {
  console.warn(
    "[backfill-agency-hierarchy] Using default local MONGODB_URI. Set MONGODB_URI for production.",
  );
}

const agencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["MAIN", "PARTNER"], required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Agency = mongoose.models.Agency || mongoose.model("Agency", agencySchema);

async function updateManyWithLog(modelName, filter, update) {
  const model = mongoose.connection.collection(modelName);
  const result = await model.updateMany(filter, update);
  console.log(
    `${modelName}: matched=${result.matchedCount} modified=${result.modifiedCount}`,
  );
}

await mongoose.connect(MONGODB_URI);

const mainAgency = await Agency.findOneAndUpdate(
  { name: MAIN_AGENCY_NAME },
  {
    $setOnInsert: {
      name: MAIN_AGENCY_NAME,
      type: "MAIN",
      status: "ACTIVE",
      isDeleted: false,
    },
  },
  { upsert: true, new: true },
);

const mainAgencyId = mainAgency._id;
console.log(`Main agency: ${MAIN_AGENCY_NAME} (${mainAgencyId.toString()})`);

await updateManyWithLog(
  "users",
  { agencyId: { $exists: false } },
  { $set: { agencyId: mainAgencyId, agencyKind: "MAIN_EMPLOYEE" } },
);
await updateManyWithLog(
  "teammembers",
  { agencyId: { $exists: false } },
  {
    $set: {
      agencyId: mainAgencyId,
      memberScopeType: "MAIN",
      isPartnerEmployee: false,
    },
  },
);
await updateManyWithLog(
  "teamroles",
  { agencyId: { $exists: false } },
  { $set: { agencyId: mainAgencyId } },
);
await updateManyWithLog(
  "clients",
  { ownerAgencyId: { $exists: false } },
  { $set: { ownerAgencyId: mainAgencyId } },
);
await updateManyWithLog(
  "tasks",
  { agencyId: { $exists: false } },
  { $set: { agencyId: mainAgencyId } },
);
await updateManyWithLog(
  "reviewdrafts",
  { agencyId: { $exists: false } },
  { $set: { agencyId: mainAgencyId } },
);
await updateManyWithLog(
  "reviewallocations",
  { agencyId: { $exists: false } },
  { $set: { agencyId: mainAgencyId } },
);
await updateManyWithLog(
  "postedreviews",
  { agencyId: { $exists: false } },
  { $set: { agencyId: mainAgencyId } },
);
await updateManyWithLog(
  "teamassignments",
  { agencyId: { $exists: false } },
  { $set: { agencyId: mainAgencyId } },
);
await updateManyWithLog(
  "notifications",
  { agencyId: { $exists: false } },
  { $set: { agencyId: mainAgencyId } },
);

console.log("Backfill complete.");
await mongoose.disconnect();
