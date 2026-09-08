import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, FIXTURE_IDS as ID, api, closeDb, db, login, oid } from "./helpers.mjs";

let cookieA = "";
let admin = "";
before(async () => {
  cookieA = (await login(ACCOUNTS.clientA.email)).cookie;
  admin = (await login(ACCOUNTS.admin.email)).cookie;
});
after(closeDb);

test("INTERNAL events are hidden and CLIENT_VISIBLE events are shown", async () => {
  const log = await api("/api/client/change-log", { cookie: cookieA });
  assert.ok(log.json.items.some((e) => e.id === ID.eventAVisible));
  assert.ok(!log.json.items.some((e) => e.id === ID.eventAInternal));
  assert.ok(!JSON.stringify(log.json).includes("SECRET"));

  const dash = await api("/api/client/dashboard", { cookie: cookieA });
  assert.ok(!JSON.stringify(dash.json.recentActivity).includes("SECRET"));

  const detail = await api(`/api/client/reviews/${ID.allocA1}`, { cookie: cookieA });
  assert.ok(!JSON.stringify(detail.json.timeline).includes("SECRET"));
  assert.ok(detail.json.timeline.some((t) => t.step === "POSTED" && t.actorName === "Priya Sharma"));
});

test("change log filters by category and role", async () => {
  const review = await api("/api/client/change-log?category=REVIEW&role=AGENT", { cookie: cookieA });
  assert.ok(review.json.items.every((e) => e.category === "REVIEW" && e.actorRole === "AGENT"));
  assert.ok(review.json.items.length >= 1);
  const system = await api("/api/client/change-log?category=SYSTEM", { cookie: cookieA });
  assert.equal(system.json.items.length, 0);
});

test("staff can toggle an event's visibility and the client feed follows", async () => {
  const show = await api(`/api/clients/${ID.clientA}/portal/events/${ID.eventAInternal}`, {
    method: "PATCH",
    cookie: admin,
    body: { visibility: "CLIENT_VISIBLE" },
  });
  assert.equal(show.status, 200);
  let log = await api("/api/client/change-log", { cookie: cookieA });
  assert.ok(log.json.items.some((e) => e.id === ID.eventAInternal));

  const hide = await api(`/api/clients/${ID.clientA}/portal/events/${ID.eventAInternal}`, {
    method: "PATCH",
    cookie: admin,
    body: { visibility: "INTERNAL" },
  });
  assert.equal(hide.status, 200);
  log = await api("/api/client/change-log", { cookie: cookieA });
  assert.ok(!log.json.items.some((e) => e.id === ID.eventAInternal));

  const audit = await (await db())
    .collection("teamactivitylogs")
    .find({ action: "CLIENT_EVENT_VISIBILITY_CHANGED", entityId: ID.clientA })
    .toArray();
  assert.ok(audit.length >= 2, "visibility changes are audited");
});

test("staff cannot change events of a client through another client's route", async () => {
  const res = await api(`/api/clients/${ID.clientB}/portal/events/${ID.eventAInternal}`, {
    method: "PATCH",
    cookie: admin,
    body: { visibility: "CLIENT_VISIBLE" },
  });
  assert.equal(res.status, 404);
});

test("live review activity is mapped into the client feed with actor role and a notification", async () => {
  const before = await api("/api/client/notifications/unread-count", { cookie: cookieA });
  const shared = await api(`/api/review-allocations/${ID.allocA3}/mark-shared`, {
    method: "PATCH",
    cookie: admin,
    body: {
      customerName: "Sneha Reddy",
      platform: "Google",
      sentDate: new Date().toISOString().slice(0, 10),
      performedBy: ACCOUNTS.admin.name,
    },
  });
  assert.equal(shared.status, 200);

  const log = await api("/api/client/change-log", { cookie: cookieA });
  const ev = log.json.items.find((e) => e.action === "REVIEW_SHARED" && e.relatedReviewId === ID.allocA3);
  assert.ok(ev, "shared event visible to client");
  assert.equal(ev.actorRole, "ADMIN");
  assert.equal(ev.actorName, ACCOUNTS.admin.name);
  assert.match(ev.description, /Sneha Reddy/);

  const after = await api("/api/client/notifications/unread-count", { cookie: cookieA });
  assert.equal(after.json.count, before.json.count + 1);

  const reviews = await api("/api/client/reviews?status=SHARED", { cookie: cookieA });
  assert.ok(reviews.json.items.some((r) => r.id === ID.allocA3 && r.customerName === "Sneha Reddy"));

  // The same activity must not leak into client B.
  const cookieB = (await login(ACCOUNTS.clientB.email)).cookie;
  const logB = await api("/api/client/change-log", { cookie: cookieB });
  assert.ok(!logB.json.items.some((e) => /Sneha Reddy/.test(e.description)));
});

test("internal-only review activity stays hidden (contact-only allocation update)", async () => {
  const res = await api(`/api/review-allocations/${ID.allocA1}`, {
    method: "PATCH",
    cookie: admin,
    body: { customerContact: "private-contact-9999", performedBy: ACCOUNTS.admin.name },
  });
  assert.equal(res.status, 200);
  const log = await api("/api/client/change-log?pageSize=50", { cookie: cookieA });
  assert.ok(!JSON.stringify(log.json).includes("private-contact-9999"));
  assert.ok(!log.json.items.some((e) => e.action === "ALLOCATION_UPDATED_INTERNAL"));
  const internal = await (await db())
    .collection("clientevents")
    .findOne({ clientId: oid(ID.clientA), action: "ALLOCATION_UPDATED_INTERNAL", visibility: "INTERNAL", source: "REVIEW_ACTIVITY" });
  assert.ok(internal, "internal event recorded with INTERNAL visibility");
});

test("published updates notify client logins and appear in the change log", async () => {
  const before = await api("/api/client/notifications/unread-count", { cookie: cookieA });
  const created = await api(`/api/clients/${ID.clientA}/portal/updates`, {
    method: "POST",
    cookie: admin,
    body: { title: "Google review target reached", body: "You hit 10 reviews this month.", category: "PROGRESS", isPublished: true },
  });
  assert.equal(created.status, 201);
  const updates = await api("/api/client/updates", { cookie: cookieA });
  assert.ok(updates.json.items.some((u) => u.title === "Google review target reached" && u.isRead === false));
  const after = await api("/api/client/notifications/unread-count", { cookie: cookieA });
  assert.equal(after.json.count, before.json.count + 1);

  const draft = await api(`/api/clients/${ID.clientA}/portal/updates`, {
    method: "POST",
    cookie: admin,
    body: { title: "Internal draft note", body: "Not for client eyes yet.", category: "ANNOUNCEMENT", isPublished: false },
  });
  assert.equal(draft.status, 201);
  const again = await api("/api/client/updates", { cookie: cookieA });
  assert.ok(!again.json.items.some((u) => u.title === "Internal draft note"));
});
