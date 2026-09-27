import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  ACCOUNTS,
  FIXTURE_IDS as ID,
  api,
  closeDb,
  db,
  login,
  oid,
} from "./helpers.mjs";

const DRAFT_ID = "66a000000000000000000d91";
const ALLOC_ID = "66a000000000000000000e91";
const LABEL = "P0 hardening review";

let admin = "";
let noPerm = "";

before(async () => {
  admin = (await login(ACCOUNTS.admin.email)).cookie;
  noPerm = (await login(ACCOUNTS.managerNoPerm.email)).cookie;

  const database = await db();
  const now = new Date();
  await database.collection("reviewdrafts").insertOne({
    _id: oid(DRAFT_ID),
    subject: LABEL,
    reviewText: "P0 hardening review — great service.",
    clientId: oid(ID.clientA),
    clientName: "Alpha Dental",
    category: "General",
    language: "English",
    suggestedRating: "5",
    tone: "Professional",
    reusable: true,
    status: "Allocated",
    createdBy: ACCOUNTS.admin.name,
    createdAt: now,
    updatedAt: now,
  });
  await database.collection("reviewallocations").insertOne({
    _id: oid(ALLOC_ID),
    draftId: oid(DRAFT_ID),
    assignedToUserId: "hardening-member",
    assignedToUserName: "Hardening Member",
    assignedByUserId: ID.admin,
    assignedByUserName: ACCOUNTS.admin.name,
    assignedDate: now,
    allocationStatus: "Assigned",
    assigneeType: "MAIN_EMPLOYEE",
    createdAt: now,
    updatedAt: now,
  });
});

after(async () => {
  const database = await db();
  await Promise.all([
    database.collection("postedreviews").deleteMany({ allocationId: oid(ALLOC_ID) }),
    database.collection("reviewallocations").deleteMany({ _id: oid(ALLOC_ID) }),
    database.collection("reviewdrafts").deleteMany({ _id: oid(DRAFT_ID) }),
    database.collection("reviewactivitylogs").deleteMany({ entityId: { $in: [ALLOC_ID, DRAFT_ID] } }),
    database.collection("clientevents").deleteMany({ relatedReviewId: oid(ALLOC_ID) }),
    database.collection("reviews").deleteMany({ shortLabel: LABEL }),
  ]);
  await closeDb();
});

test("review mutation requires workflow permission", async () => {
  const res = await api("/api/review-allocations/" + ALLOC_ID + "/mark-shared", {
    method: "PATCH",
    cookie: noPerm,
    body: { customerName: "Permission Probe", sentDate: "2026-09-27" },
  });
  assert.equal(res.status, 403);
});

test("Assigned -> Shared -> Posted succeeds and posted retry is idempotent", async () => {
  const shared = await api("/api/review-allocations/" + ALLOC_ID + "/mark-shared", {
    method: "PATCH",
    cookie: admin,
    body: {
      customerName: "Hardening Customer",
      customerContact: "9000000000",
      platform: "Google",
      sentDate: "2026-09-27",
      performedBy: ACCOUNTS.admin.name,
    },
  });
  assert.equal(shared.status, 200);
  assert.equal(shared.json.allocationStatus, "Shared with Customer");

  const postBody = {
    postedByName: "Hardening Customer",
    customerContact: "9000000000",
    platform: "Google",
    reviewLink: "https://example.com/p0-hardening-review",
    proofUrl: "https://example.com/p0-hardening-proof",
    postedDate: "2026-09-27",
    markedUsedBy: ACCOUNTS.admin.name,
    performedBy: ACCOUNTS.admin.name,
  };

  const first = await api("/api/review-allocations/" + ALLOC_ID + "/mark-posted", {
    method: "PATCH", cookie: admin, body: postBody,
  });
  assert.equal(first.status, 200);
  assert.equal(first.json.allocation.allocationStatus, "Posted");
  assert.equal(first.json.idempotent, false);

  const retry = await api("/api/review-allocations/" + ALLOC_ID + "/mark-posted", {
    method: "PATCH", cookie: admin, body: postBody,
  });
  assert.equal(retry.status, 200);
  assert.equal(retry.json.allocation.allocationStatus, "Posted");
  assert.equal(retry.json.idempotent, true);

  const database = await db();
  assert.equal(
    await database.collection("postedreviews").countDocuments({ allocationId: oid(ALLOC_ID) }),
    1,
    "one canonical PostedReview per allocation",
  );
  const draft = await database.collection("reviewdrafts").findOne({ _id: oid(DRAFT_ID) });
  assert.equal(draft.status, "Used");
});

test("backward transition and generic lifecycle bypass are rejected", async () => {
  const backward = await api("/api/review-allocations/" + ALLOC_ID + "/mark-shared", {
    method: "PATCH", cookie: admin,
    body: { customerName: "Hardening Customer", sentDate: "2026-09-27" },
  });
  assert.equal(backward.status, 409);
  assert.equal(backward.json.code, "CONFLICT");

  const generic = await api("/api/review-allocations/" + ALLOC_ID, {
    method: "PATCH", cookie: admin,
    body: { allocationStatus: "Cancelled", performedBy: ACCOUNTS.admin.name },
  });
  assert.equal(generic.status, 409);
  assert.equal(generic.json.code, "CONFLICT");
});
