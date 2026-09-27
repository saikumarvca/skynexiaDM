/**
 * Staff-managed client logins: create with a temporary password, forced
 * password change on first sign-in, password reset, deactivation, and the
 * session revocation each of those implies.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  ACCOUNTS,
  FIXTURE_IDS as ID,
  api,
  assertRedirect,
  closeDb,
  cookieValue,
  db,
  login,
  page,
} from "./helpers.mjs";

after(closeDb);

let admin = "";
before(async () => {
  admin = (await login(ACCOUNTS.admin.email)).cookie;
});

const users = (clientId, rest = "") => `/api/clients/${clientId}/portal/users${rest}`;
const INVITED = "invited-owner@test.local";
const TEMP_PASSWORD_RE = /^[A-HJ-NP-Za-hj-km-z2-9]{4}(-[A-HJ-NP-Za-hj-km-z2-9]{4}){3}$/;
/** Session tokens carry an issued-at in whole seconds; cross a boundary before revoking. */
const nextSecond = () => new Promise((r) => setTimeout(r, 1100));

let created = null; // { login, temporaryPassword }
let chosenPassword = "Owner-Chosen-Pass-1";

test("create: validates input and requires manage_clients", async () => {
  const noPerm = (await login(ACCOUNTS.managerNoPerm.email)).cookie;
  const denied = await api(users(ID.clientA), { method: "POST", cookie: noPerm, body: { email: INVITED } });
  assert.equal(denied.status, 403);

  const badEmail = await api(users(ID.clientA), { method: "POST", cookie: admin, body: { email: "not-an-email" } });
  assert.equal(badEmail.status, 422);
  const unknownField = await api(users(ID.clientA), {
    method: "POST",
    cookie: admin,
    body: { email: INVITED, role: "ADMIN" },
  });
  assert.equal(unknownField.status, 422, "cannot smuggle a role or other fields");

  const taken = await api(users(ID.clientA), { method: "POST", cookie: admin, body: { email: ACCOUNTS.admin.email } });
  assert.equal(taken.status, 409, "an existing account's email is refused");
});

test("create: staff get a one-time temporary password; the login must change it first", async () => {
  const res = await api(users(ID.clientA), {
    method: "POST",
    cookie: admin,
    body: { email: INVITED.toUpperCase(), sendInvite: false },
  });
  assert.equal(res.status, 201);
  created = res.json;
  assert.equal(created.login.email, INVITED, "email is normalised to lower case");
  assert.equal(created.login.name, "Alpha Dental", "display name defaults to the business name");
  assert.equal(created.login.isActive, true);
  assert.equal(created.login.mustChangePassword, true);
  assert.equal(created.login.lastLoginAt, null);
  assert.equal(created.emailSent, false, "no email provider is configured in tests");
  assert.match(created.temporaryPassword, TEMP_PASSWORD_RE);

  const stored = await (await db()).collection("users").findOne({ email: INVITED });
  assert.equal(stored.role, "CLIENT");
  assert.equal(String(stored.clientId), ID.clientA);
  assert.notEqual(stored.passwordHash, created.temporaryPassword, "password is hashed");
  assert.ok(!JSON.stringify(res.json).includes(stored.passwordHash), "hash never leaves the server");

  const list = await api(users(ID.clientA), { cookie: admin });
  assert.ok(list.json.some((u) => u.id === created.login.id && u.mustChangePassword === true));

  const audit = await (await db())
    .collection("teamactivitylogs")
    .findOne({ action: "CLIENT_LOGIN_CREATED", entityId: ID.clientA, targetName: INVITED });
  assert.ok(audit, "creation is audited");
});

test("first sign-in with the temporary password is confined to the password page", async () => {
  const first = await login(INVITED, created.temporaryPassword, { portal: "client" });
  assert.equal(first.res.status, 200);
  assert.equal(first.body.mustChangePassword, true);
  assert.match(first.body.redirectTo, /^\/client\/profile\?reason=password/);
  const cookie = first.cookie;

  const dash = await api("/api/client/dashboard", { cookie });
  assert.equal(dash.status, 403);
  assert.equal(dash.json.code, "PASSWORD_CHANGE_REQUIRED");
  assert.equal((await api("/api/client/reviews", { cookie })).status, 403);
  assert.equal((await api("/api/client/profile", { cookie })).status, 200, "profile stays readable");

  assertRedirect(await page("/client/dashboard", cookie), /\/client\/profile\?reason=password/);
  assert.equal((await page("/client/profile", cookie)).status, 200);

  const list = await api(users(ID.clientA), { cookie: admin });
  const me = list.json.find((u) => u.id === created.login.id);
  assert.ok(me.lastLoginAt, "last sign-in is recorded");

  // Choosing a password lifts the restriction and re-issues the cookie.
  await nextSecond();
  const change = await api("/api/client/profile/password", {
    method: "POST",
    cookie,
    body: { currentPassword: created.temporaryPassword, newPassword: chosenPassword },
  });
  assert.equal(change.status, 200);
  assert.equal(change.json.redirectTo, "/client/dashboard");
  const fresh = cookieValue(change.res.headers.get("set-cookie") ?? "", "dm_session");
  assert.ok(fresh, "a fresh session cookie is issued");
  assert.notEqual(fresh, cookieValue(cookie, "dm_session"));

  const withFresh = `dm_session=${fresh}`;
  assert.equal((await api("/api/client/dashboard", { cookie: withFresh })).status, 200);
  assert.equal((await api("/api/client/dashboard", { cookie })).status, 401, "the pre-change cookie is revoked");
  assert.equal((await login(INVITED, created.temporaryPassword)).res.status, 401, "temporary password no longer works");
  const again = await login(INVITED, chosenPassword);
  assert.equal(again.res.status, 200);
  assert.equal(again.body.mustChangePassword, false);
  assert.equal(again.body.redirectTo, "/client/dashboard");
});

test("staff password reset signs the login out everywhere and forces a new password", async () => {
  const before = await login(INVITED, chosenPassword);
  assert.equal((await api("/api/client/dashboard", { cookie: before.cookie })).status, 200);

  await nextSecond();
  const reset = await api(users(ID.clientA, `/${created.login.id}/reset-password`), {
    method: "POST",
    cookie: admin,
    body: { sendEmail: false },
  });
  assert.equal(reset.status, 200);
  assert.match(reset.json.temporaryPassword, TEMP_PASSWORD_RE);
  assert.notEqual(reset.json.temporaryPassword, created.temporaryPassword);
  assert.equal(reset.json.login.mustChangePassword, true);

  assert.equal((await api("/api/client/dashboard", { cookie: before.cookie })).status, 401, "existing session revoked");
  assert.equal((await login(INVITED, chosenPassword)).res.status, 401, "old password gone");
  const temp = await login(INVITED, reset.json.temporaryPassword, { portal: "client" });
  assert.equal(temp.res.status, 200);
  assert.equal(temp.body.mustChangePassword, true);

  chosenPassword = "Owner-Chosen-Pass-2";
  await nextSecond();
  const change = await api("/api/client/profile/password", {
    method: "POST",
    cookie: temp.cookie,
    body: { currentPassword: reset.json.temporaryPassword, newPassword: chosenPassword },
  });
  assert.equal(change.status, 200);

  const audit = await (await db())
    .collection("teamactivitylogs")
    .findOne({ action: "CLIENT_LOGIN_PASSWORD_RESET", entityId: ID.clientA, targetName: INVITED });
  assert.ok(audit, "reset is audited");
});

test("deactivating a login revokes it at once; reactivating restores sign-in", async () => {
  const session = await login(INVITED, chosenPassword);
  assert.equal((await api("/api/client/dashboard", { cookie: session.cookie })).status, 200);

  await nextSecond();
  const off = await api(users(ID.clientA, `/${created.login.id}`), {
    method: "PATCH",
    cookie: admin,
    body: { isActive: false },
  });
  assert.equal(off.status, 200);
  assert.equal(off.json.isActive, false);
  assert.equal((await api("/api/client/dashboard", { cookie: session.cookie })).status, 401);
  assert.equal((await login(INVITED, chosenPassword, { portal: "client" })).res.status, 401);

  const on = await api(users(ID.clientA, `/${created.login.id}`), {
    method: "PATCH",
    cookie: admin,
    body: { isActive: true, name: "Alpha Owner (renamed)" },
  });
  assert.equal(on.status, 200);
  assert.equal(on.json.isActive, true);
  assert.equal(on.json.name, "Alpha Owner (renamed)");
  assert.equal((await api("/api/client/dashboard", { cookie: session.cookie })).status, 401, "old session stays revoked");
  assert.equal((await login(INVITED, chosenPassword)).res.status, 200, "a new sign-in works");
});

test("logins are scoped to their client and inputs are validated", async () => {
  const viaB = await api(users(ID.clientB, `/${created.login.id}`), {
    method: "PATCH",
    cookie: admin,
    body: { isActive: false },
  });
  assert.equal(viaB.status, 404);
  const resetViaB = await api(users(ID.clientB, `/${created.login.id}/reset-password`), { method: "POST", cookie: admin });
  assert.equal(resetViaB.status, 404);
  const internalUser = await api(users(ID.clientA, `/${ID.managerNoPerm}`), {
    method: "PATCH",
    cookie: admin,
    body: { isActive: false },
  });
  assert.equal(internalUser.status, 404, "internal accounts are not client logins");
  assert.equal((await api(users(ID.clientA, "/not-an-id"), { method: "PATCH", cookie: admin, body: { isActive: false } })).status, 404);

  const empty = await api(users(ID.clientA, `/${created.login.id}`), { method: "PATCH", cookie: admin, body: {} });
  assert.equal(empty.status, 422);
  const stray = await api(users(ID.clientA, `/${created.login.id}`), {
    method: "PATCH",
    cookie: admin,
    body: { role: "ADMIN" },
  });
  assert.equal(stray.status, 422);

  const client = (await login(ACCOUNTS.clientA.email)).cookie;
  assert.equal((await api(users(ID.clientA), { method: "POST", cookie: client, body: { email: "x@test.local" } })).status, 403);
  assert.equal((await api(users(ID.clientA, `/${created.login.id}/reset-password`), { method: "POST", cookie: client })).status, 403);
});
