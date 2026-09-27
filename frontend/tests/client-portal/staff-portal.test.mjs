/**
 * Staff-side client-portal management (/api/clients/[clientId]/portal/*):
 * client logins, the event feed, and publishing / editing / removing updates.
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, FIXTURE_IDS as ID, api, login } from "./helpers.mjs";

let admin = "";
let cookieA = "";
before(async () => {
  admin = (await login(ACCOUNTS.admin.email)).cookie;
  cookieA = (await login(ACCOUNTS.clientA.email)).cookie;
});

const portal = (clientId, rest = "") => `/api/clients/${clientId}/portal${rest}`;
const clientSees = async (updateId) =>
  (await api("/api/client/updates", { cookie: cookieA })).json.items.some((u) => u.id === updateId);

test("unknown or malformed client ids are 404 for staff", async () => {
  assert.equal((await api(portal("66a0000000000000000fffff", "/updates"), { cookie: admin })).status, 404);
  assert.equal((await api(portal("not-an-id", "/updates"), { cookie: admin })).status, 404);
  assert.equal((await api(portal("66a0000000000000000fffff", "/users"), { cookie: admin })).status, 404);
});

test("portal users: lists only this client's logins and never exposes secrets", async () => {
  const a = await api(portal(ID.clientA, "/users"), { cookie: admin });
  assert.equal(a.status, 200);
  assert.deepEqual(
    a.json.map((u) => u.id).sort(),
    [ID.clientAUser, ID.clientAOwner, ID.clientInactive].sort(),
  );
  assert.equal(a.json.find((u) => u.id === ID.clientInactive).isActive, false);
  assert.ok(!/passwordHash|\$2[aby]\$/.test(a.text), "no password hashes in the response");

  const b = await api(portal(ID.clientB, "/users"), { cookie: admin });
  assert.deepEqual(b.json.map((u) => u.id), [ID.clientBUser]);
});

test("portal events: staff see internal rows, filter by visibility, and stay per client", async () => {
  const all = await api(portal(ID.clientA, "/events"), { cookie: admin });
  assert.equal(all.status, 200);
  const ids = all.json.items.map((e) => e.id);
  assert.ok(ids.includes(ID.eventAVisible));
  assert.ok(ids.includes(ID.eventAInternal));
  assert.ok(!ids.includes(ID.eventBVisible));

  const internal = await api(portal(ID.clientA, "/events?visibility=internal"), { cookie: admin });
  assert.ok(internal.json.items.length >= 1);
  assert.ok(internal.json.items.every((e) => e.visibility === "INTERNAL"));

  const visible = await api(portal(ID.clientA, "/events?visibility=CLIENT_VISIBLE"), { cookie: admin });
  assert.ok(visible.json.items.every((e) => e.visibility === "CLIENT_VISIBLE"));
  assert.ok(visible.json.items.some((e) => e.id === ID.eventAVisible));
});

test("editing a draft update does not publish it or reset its category", async () => {
  const edited = await api(portal(ID.clientA, `/updates/${ID.updateADraft}`), {
    method: "PATCH",
    cookie: admin,
    body: { title: "Alpha feature note (edited)" },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.json.title, "Alpha feature note (edited)");
  assert.equal(edited.json.isPublished, false, "a title edit must not publish the draft");
  assert.equal(edited.json.category, "FEATURE", "a title edit must not reset the category");
  assert.equal(await clientSees(ID.updateADraft), false);

  const countBefore = (await api("/api/client/notifications/unread-count", { cookie: cookieA })).json.count;
  const published = await api(portal(ID.clientA, `/updates/${ID.updateADraft}`), {
    method: "PATCH",
    cookie: admin,
    body: { isPublished: true },
  });
  assert.equal(published.status, 200);
  assert.equal(published.json.isPublished, true);
  assert.equal(published.json.category, "FEATURE", "toggling visibility keeps the category");
  assert.equal(await clientSees(ID.updateADraft), true);
  const countAfter = (await api("/api/client/notifications/unread-count", { cookie: cookieA })).json.count;
  assert.equal(countAfter, countBefore + 1, "publishing notifies the client");
});

test("updates: invalid bodies are rejected", async () => {
  const unknownField = await api(portal(ID.clientA, `/updates/${ID.updateADraft}`), {
    method: "PATCH",
    cookie: admin,
    body: { clientId: ID.clientB },
  });
  assert.equal(unknownField.status, 422);

  const badLink = await api(portal(ID.clientA, "/updates"), {
    method: "POST",
    cookie: admin,
    body: { title: "Bad link", body: "x", linkUrl: "javascript:alert(1)" },
  });
  assert.equal(badLink.status, 422);

  const empty = await api(portal(ID.clientA, "/updates"), { method: "POST", cookie: admin, body: { title: " " } });
  assert.equal(empty.status, 422);
});

test("updates: removing one hides it from the client; other clients' routes cannot touch it", async () => {
  const created = await api(portal(ID.clientA, "/updates"), {
    method: "POST",
    cookie: admin,
    body: { title: "Temporary notice", body: "Will be removed." },
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.isPublished, true, "updates are published by default");
  assert.equal(created.json.category, "ANNOUNCEMENT", "default category");
  const id = created.json.id;
  assert.equal(await clientSees(id), true);

  const viaB = await api(portal(ID.clientB, `/updates/${id}`), { method: "DELETE", cookie: admin });
  assert.equal(viaB.status, 404);
  const patchViaB = await api(portal(ID.clientB, `/updates/${id}`), {
    method: "PATCH",
    cookie: admin,
    body: { title: "hijacked" },
  });
  assert.equal(patchViaB.status, 404);

  const removed = await api(portal(ID.clientA, `/updates/${id}`), { method: "DELETE", cookie: admin });
  assert.equal(removed.status, 200);
  assert.equal(await clientSees(id), false);
  const staffList = await api(portal(ID.clientA, "/updates?pageSize=100"), { cookie: admin });
  assert.ok(!staffList.json.items.some((u) => u.id === id), "removed updates leave the staff list too");

  const again = await api(portal(ID.clientA, `/updates/${id}`), { method: "DELETE", cookie: admin });
  assert.equal(again.status, 404);
});
