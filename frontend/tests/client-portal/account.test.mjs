/**
 * Account-level behaviour of a client login: notifications read state,
 * password change, sign-out and deactivation. Uses the dedicated
 * `clientAOwner` login so the other suites keep a predictable state.
 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import {
  ACCOUNTS,
  BASE_URL,
  FIXTURE_IDS as ID,
  PASSWORD,
  api,
  closeDb,
  cookieFromResponse,
  db,
  login,
  oid,
} from "./helpers.mjs";

after(closeDb);

const OWNER = ACCOUNTS.clientAOwner.email;
const NEW_PASSWORD = "Portal-Test-Pass-2";

test("notifications: marking one read, then all read, only touches the caller's own", async () => {
  const cookie = (await login(OWNER)).cookie;

  const list = await api("/api/client/notifications", { cookie });
  assert.equal(list.status, 200);
  assert.deepEqual(list.json.items.map((n) => n.id).sort(), [ID.notifOwner1, ID.notifOwner2].sort());

  const one = await api(`/api/client/notifications/${ID.notifOwner1}/read`, { method: "POST", cookie });
  assert.equal(one.status, 200);
  assert.equal(one.json.id, ID.notifOwner1);
  assert.equal(one.json.isRead, true);
  assert.equal((await api("/api/client/notifications/unread-count", { cookie })).json.count, 1);

  const bogus = await api("/api/client/notifications/not-an-id/read", { method: "POST", cookie });
  assert.equal(bogus.status, 404);
  // Same client, different login: still not the caller's notification.
  const sibling = await api(`/api/client/notifications/${ID.notifA}/read`, { method: "POST", cookie });
  assert.equal(sibling.status, 404);

  const all = await api("/api/client/notifications/read-all", { method: "POST", cookie });
  assert.equal(all.status, 200);
  assert.equal(all.json.updated, 1);
  assert.equal((await api("/api/client/notifications/unread-count", { cookie })).json.count, 0);

  const notifications = (await db()).collection("notifications");
  const untouched = await notifications.find({ _id: { $in: [oid(ID.notifA), oid(ID.notifB)] } }).toArray();
  assert.equal(untouched.length, 2);
  assert.ok(untouched.every((n) => n.isRead === false), "other logins' notifications stay unread");
});

test("password change: validates input and rejects a wrong current password", async () => {
  const cookie = (await login(OWNER)).cookie;
  const change = (body) => api("/api/client/profile/password", { method: "POST", cookie, body });

  assert.equal((await change({ newPassword: NEW_PASSWORD })).status, 400);
  assert.equal((await change({ currentPassword: PASSWORD, newPassword: "short" })).status, 400);
  assert.equal((await change({ currentPassword: PASSWORD, newPassword: PASSWORD })).status, 400);
  const wrong = await change({ currentPassword: "definitely-wrong", newPassword: NEW_PASSWORD });
  assert.equal(wrong.status, 400);
  assert.match(wrong.json.error ?? "", /incorrect/i);

  // Nothing above may have changed the stored password.
  assert.equal((await login(OWNER)).res.status, 200);
});

test("password change: new password works, old one stops working, change is audited", async () => {
  const cookie = (await login(OWNER)).cookie;
  const res = await api("/api/client/profile/password", {
    method: "POST",
    cookie,
    body: { currentPassword: PASSWORD, newPassword: NEW_PASSWORD },
  });
  assert.equal(res.status, 200);

  try {
    assert.equal((await login(OWNER, PASSWORD, { portal: "client" })).res.status, 401);
    const fresh = await login(OWNER, NEW_PASSWORD, { portal: "client" });
    assert.equal(fresh.res.status, 200);
    assert.equal(fresh.body.user?.role, "CLIENT");

    const audit = await (await db())
      .collection("teamactivitylogs")
      .findOne({ action: "CLIENT_PASSWORD_CHANGED", userId: ID.clientAOwner });
    assert.ok(audit, "password change is audited");
  } finally {
    // Restore through the API so later tests can sign in with PASSWORD.
    const cookieNew = (await login(OWNER, NEW_PASSWORD)).cookie;
    const restore = await api("/api/client/profile/password", {
      method: "POST",
      cookie: cookieNew,
      body: { currentPassword: NEW_PASSWORD, newPassword: PASSWORD },
    });
    assert.equal(restore.status, 200);
  }
});

test("logout clears the session cookie", async () => {
  const { cookie } = await login(OWNER);
  const res = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { cookie },
    redirect: "manual",
  });
  assert.equal(res.status, 200);
  const cleared = cookieFromResponse(res);
  assert.match(cleared, /(^|; )dm_session=($|;)/, "dm_session is reset to an empty value");
  const raw = (res.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("dm_session="));
  assert.match(raw ?? "", /Max-Age=0/i);
});

test("deactivating a client login revokes its existing session immediately", async () => {
  const { cookie } = await login(OWNER);
  assert.equal((await api("/api/client/dashboard", { cookie })).status, 200);

  const users = (await db()).collection("users");
  await users.updateOne({ _id: oid(ID.clientAOwner) }, { $set: { isActive: false } });
  try {
    assert.equal((await api("/api/client/dashboard", { cookie })).status, 401);
    assert.equal((await api("/api/client/reviews", { cookie })).status, 401);
    assert.equal((await login(OWNER, PASSWORD, { portal: "client" })).res.status, 401);
  } finally {
    await users.updateOne({ _id: oid(ID.clientAOwner) }, { $set: { isActive: true } });
  }
  assert.equal((await api("/api/client/dashboard", { cookie })).status, 200);
});
