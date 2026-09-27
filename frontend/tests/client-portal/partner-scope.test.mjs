import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, FIXTURE_IDS as ID, api, closeDb, login } from "./helpers.mjs";

let partnerA = "";
let partnerB = "";
let partnerAWorker = "";

before(async () => {
  partnerA = (await login(ACCOUNTS.partnerA.email)).cookie;
  partnerB = (await login(ACCOUNTS.partnerB.email)).cookie;
  partnerAWorker = (await login(ACCOUNTS.partnerAEmployee.email)).cookie;
});

after(closeDb);

test("SKY-SCOPE-002: partner agencies only list their own clients", async () => {
  const a = await api("/api/clients?limit=100", { cookie: partnerA });
  const b = await api("/api/clients?limit=100", { cookie: partnerB });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.deepEqual(a.json.map((x) => x._id), [ID.clientA]);
  assert.deepEqual(b.json.map((x) => x._id), [ID.clientB]);
  assert.equal(a.json[0].ownerAgencyId, ID.mainAgency);
  assert.equal(b.json[0].ownerAgencyId, ID.mainAgency);
  assert.equal(a.json[0].assignedPartnerAgencyId, ID.partnerAAgency);
  assert.equal(b.json[0].assignedPartnerAgencyId, ID.partnerBAgency);
});

test("SKY-SCOPE-002: partner agencies cannot enumerate another partner team", async () => {
  const a = await api("/api/team/members?pageSize=100&limit=100", { cookie: partnerA });
  const b = await api("/api/team/members?pageSize=100&limit=100", { cookie: partnerB });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  const aIds = a.json.items.map((x) => x._id);
  const bIds = b.json.items.map((x) => x._id);
  assert.ok(aIds.includes(ID.partnerAMember));
  assert.ok(aIds.includes(ID.partnerAEmployeeMember));
  assert.ok(!aIds.includes(ID.partnerBMember));
  assert.deepEqual(bIds, [ID.partnerBMember]);
});

test("SKY-SCOPE-002: reviews and tasks are partner scoped", async () => {
  const reviewsA = await api("/api/review-allocations?pageSize=100", { cookie: partnerA });
  const reviewsB = await api("/api/review-allocations?pageSize=100", { cookie: partnerB });
  assert.equal(reviewsA.status, 200);
  assert.equal(reviewsB.status, 200);
  const aReviewIds = reviewsA.json.items.map((x) => x._id);
  const bReviewIds = reviewsB.json.items.map((x) => x._id);
  assert.ok(aReviewIds.includes(ID.allocA1));
  assert.ok(aReviewIds.includes(ID.allocA3));
  assert.ok(!aReviewIds.includes(ID.allocB1));
  assert.deepEqual(bReviewIds, [ID.allocB1]);

  const tasksA = await api("/api/tasks", { cookie: partnerA });
  const tasksB = await api("/api/tasks", { cookie: partnerB });
  assert.equal(tasksA.status, 200);
  assert.equal(tasksB.status, 200);
  assert.deepEqual(tasksA.json.map((x) => x._id), [ID.taskA]);
  assert.deepEqual(tasksB.json.map((x) => x._id), [ID.taskB]);
});

test("SKY-SCOPE-003: partner employee sees only directly assigned work", async () => {
  const reviews = await api("/api/review-allocations?pageSize=100", { cookie: partnerAWorker });
  assert.equal(reviews.status, 200);
  assert.deepEqual(reviews.json.items.map((x) => x._id), [ID.allocA3]);

  const tasks = await api("/api/tasks", { cookie: partnerAWorker });
  assert.equal(tasks.status, 200);
  assert.deepEqual(tasks.json.map((x) => x._id), [ID.taskA]);
});

test("SKY-SCOPE-002: Partner A cannot mutate Partner B review by guessed id", async () => {
  const res = await api("/api/review-allocations/" + ID.allocB1 + "/mark-posted", {
    method: "PATCH",
    cookie: partnerA,
    body: {
      postedByName: "Scope Probe",
      platform: "Google",
      reviewLink: "https://example.com/should-not-write",
      postedDate: "2026-09-27",
    },
  });
  assert.equal(res.status, 404);
});
