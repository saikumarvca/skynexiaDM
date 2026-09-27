import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, FIXTURE_IDS as ID, api, closeDb, login } from "./helpers.mjs";

let admin = "";

before(async () => {
  admin = (await login(ACCOUNTS.admin.email)).cookie;
});

after(closeDb);

test("SKY-API-003: review allocations are paginated and bounded", async () => {
  const first = await api("/api/review-allocations?page=1&pageSize=1", { cookie: admin });
  assert.equal(first.status, 200);
  assert.equal(Array.isArray(first.json.items), true);
  assert.equal(first.json.items.length, 1);
  assert.equal(first.json.page, 1);
  assert.equal(first.json.pageSize, 1);
  assert.ok(first.json.total >= 3);
  assert.ok(first.json.totalPages >= 3);

  const clamped = await api("/api/review-allocations?pageSize=999", { cookie: admin });
  assert.equal(clamped.status, 200);
  assert.equal(clamped.json.pageSize, 100);
});

test("SKY-API-003: client filtering happens before pagination", async () => {
  const a = await api("/api/review-allocations?clientId=" + ID.clientA + "&pageSize=100", { cookie: admin });
  const b = await api("/api/review-allocations?clientId=" + ID.clientB + "&pageSize=100", { cookie: admin });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.deepEqual(a.json.items.map((x) => x._id).sort(), [ID.allocA1, ID.allocA3].sort());
  assert.deepEqual(b.json.items.map((x) => x._id), [ID.allocB1]);
  assert.equal(a.json.total, 2);
  assert.equal(b.json.total, 1);
});

test("SKY-API-003: draft and search filters remain bounded", async () => {
  const drafts = await api("/api/review-allocations?draftIds=" + ID.draftA3 + "," + ID.draftB1 + "&pageSize=100", { cookie: admin });
  assert.equal(drafts.status, 200);
  assert.deepEqual(drafts.json.items.map((x) => x._id).sort(), [ID.allocA3, ID.allocB1].sort());

  const search = await api("/api/review-allocations?search=Beta%20Customer&pageSize=100", { cookie: admin });
  assert.equal(search.status, 200);
  assert.deepEqual(search.json.items.map((x) => x._id), [ID.allocB1]);
});
