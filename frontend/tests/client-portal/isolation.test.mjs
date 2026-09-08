import { test, before } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, FIXTURE_IDS as ID, api, login } from "./helpers.mjs";

let cookieA = "";
let cookieB = "";

before(async () => {
  cookieA = (await login(ACCOUNTS.clientA.email)).cookie;
  cookieB = (await login(ACCOUNTS.clientB.email)).cookie;
});

test("reviews: each client only lists its own reviews", async () => {
  const a = await api("/api/client/reviews", { cookie: cookieA });
  assert.equal(a.status, 200);
  const idsA = a.json.items.map((r) => r.id).sort();
  assert.deepEqual(idsA, [ID.allocA1, ID.allocA3, ID.draftA2].sort());
  assert.equal(a.json.total, 3);
  assert.equal(a.json.counts.POSTED, 1);
  assert.equal(a.json.counts.IN_PROGRESS, 1);
  assert.equal(a.json.counts.DRAFT, 1);

  const b = await api("/api/client/reviews", { cookie: cookieB });
  assert.deepEqual(
    b.json.items.map((r) => r.id),
    [ID.allocB1],
  );
});

test("reviews: a clientId query parameter is ignored (scope comes from the session)", async () => {
  const a = await api(`/api/client/reviews?clientId=${ID.clientB}`, { cookie: cookieA });
  assert.equal(a.status, 200);
  assert.ok(!a.json.items.some((r) => r.id === ID.allocB1));
});

test("review detail: cross-client ids return 404, own ids return 200", async () => {
  const own = await api(`/api/client/reviews/${ID.allocA1}`, { cookie: cookieA });
  assert.equal(own.status, 200);
  assert.equal(own.json.customerName, "Ramesh Kumar");
  assert.equal(own.json.status, "POSTED");
  assert.equal(own.json.reviewLink, "https://example.com/alpha-review");

  const ownDraft = await api(`/api/client/reviews/${ID.draftA2}`, { cookie: cookieA });
  assert.equal(ownDraft.status, 200);
  assert.equal(ownDraft.json.status, "DRAFT");

  const otherAllocation = await api(`/api/client/reviews/${ID.allocB1}`, { cookie: cookieA });
  assert.equal(otherAllocation.status, 404);
  const otherDraft = await api(`/api/client/reviews/${ID.draftB1}`, { cookie: cookieA });
  assert.equal(otherDraft.status, 404);
  const bogus = await api(`/api/client/reviews/not-an-id`, { cookie: cookieA });
  assert.equal(bogus.status, 404);

  // And the reverse direction.
  const bSeesA = await api(`/api/client/reviews/${ID.allocA1}`, { cookie: cookieB });
  assert.equal(bSeesA.status, 404);
});

test("dashboard and analytics only count the client's own records", async () => {
  const dash = await api("/api/client/dashboard?range=90d", { cookie: cookieA });
  assert.equal(dash.status, 200);
  const kpi = Object.fromEntries(dash.json.kpis.map((k) => [k.key, k.value]));
  assert.equal(kpi.total, 3);
  assert.equal(kpi.posted, 1);
  assert.equal(kpi.shared, 0);
  assert.equal(kpi.inProgress, 1);
  assert.equal(kpi.drafts, 1);
  assert.ok(!dash.json.recentActivity.some((e) => /BETA-ONLY/.test(e.title)));

  const analytics = await api("/api/client/review-analytics", { cookie: cookieA });
  assert.equal(analytics.status, 200);
  assert.equal(analytics.json.summary.total, 3);
  assert.equal(analytics.json.summary.posted, 1);
  assert.equal(analytics.json.summary.averageRating, 5);
  assert.deepEqual(
    analytics.json.byPlatform.map((p) => p.platform),
    ["Google"],
  );

  const dashB = await api("/api/client/dashboard", { cookie: cookieB });
  const kpiB = Object.fromEntries(dashB.json.kpis.map((k) => [k.key, k.value]));
  assert.equal(kpiB.total, 1);
  assert.equal(kpiB.shared, 1);
});

test("change log never includes another client's events", async () => {
  const a = await api("/api/client/change-log", { cookie: cookieA });
  assert.equal(a.status, 200);
  assert.ok(a.json.items.some((e) => e.title === "Review posted on Google"));
  assert.ok(!a.json.items.some((e) => /BETA-ONLY/.test(e.title)));

  const b = await api("/api/client/change-log", { cookie: cookieB });
  assert.ok(b.json.items.some((e) => /BETA-ONLY/.test(e.title)));
  assert.ok(!b.json.items.some((e) => e.title === "Review posted on Google"));
});

test("notifications are scoped per client login", async () => {
  const a = await api("/api/client/notifications", { cookie: cookieA });
  assert.equal(a.status, 200);
  assert.deepEqual(
    a.json.items.map((n) => n.id),
    [ID.notifA],
  );
  const readOther = await api(`/api/client/notifications/${ID.notifB}/read`, { method: "POST", cookie: cookieA });
  assert.equal(readOther.status, 404);

  const count = await api("/api/client/notifications/unread-count", { cookie: cookieA });
  assert.equal(count.json.count, 1);
});

test("updates are scoped per client", async () => {
  const a = await api("/api/client/updates", { cookie: cookieA });
  assert.equal(a.status, 200);
  assert.deepEqual(
    a.json.items.map((u) => u.id),
    [ID.updateA],
  );
  const readOther = await api(`/api/client/updates/${ID.updateB}/read`, { method: "POST", cookie: cookieA });
  assert.equal(readOther.status, 404);

  const readOwn = await api(`/api/client/updates/${ID.updateA}/read`, { method: "POST", cookie: cookieA });
  assert.equal(readOwn.status, 200);
  assert.equal(readOwn.json.isRead, true);
});

test("search only returns the client's own records", async () => {
  const a = await api("/api/client/search?q=review", { cookie: cookieA });
  assert.equal(a.status, 200);
  const all = [...a.json.reviews, ...a.json.updates, ...a.json.activity];
  assert.ok(all.length > 0);
  assert.ok(!all.some((h) => /beta/i.test(h.title)));
});
