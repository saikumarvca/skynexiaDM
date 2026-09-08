import { test, after } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, FIXTURE_IDS as ID, api, closeDb, cookieFromResponse, cookieValue, db, login, page } from "./helpers.mjs";

after(closeDb);

async function startPreview(cookie, clientId = ID.clientA) {
  const res = await fetch(`${process.env.BASE_URL}/api/clients/${clientId}/portal/preview`, {
    method: "POST",
    headers: { cookie },
    redirect: "manual",
  });
  const body = await res.json().catch(() => ({}));
  return { res, body, preview: cookieValue(cookieFromResponse(res), "dm_client_preview") };
}

test("admin can preview a client portal; the preview is read-only and audited", async () => {
  const admin = (await login(ACCOUNTS.admin.email)).cookie;
  const { res, body, preview } = await startPreview(admin);
  assert.equal(res.status, 200);
  assert.equal(body.redirectTo, "/client/dashboard");
  assert.ok(preview, "preview cookie set");

  const both = `${admin}; dm_client_preview=${preview}`;
  const dash = await api("/api/client/dashboard", { cookie: both });
  assert.equal(dash.status, 200);
  const profile = await api("/api/client/profile", { cookie: both });
  assert.equal(profile.json.isPreview, true);
  assert.equal(profile.json.client.id, ID.clientA);
  assert.equal(profile.json.previewActor.name, ACCOUNTS.admin.name);

  const html = await page("/client/dashboard", both);
  assert.equal(html.status, 200);
  assert.match(html.text, /Preview mode/);
  assert.match(html.text, /Welcome, Alpha Dental/);

  // Mutations are refused in preview mode.
  const pw = await api("/api/client/profile/password", {
    method: "POST",
    cookie: both,
    body: { currentPassword: "x", newPassword: "yyyyyyyy" },
  });
  assert.equal(pw.status, 403);
  assert.equal(pw.json.code, "PREVIEW_READ_ONLY");
  const readAll = await api("/api/client/notifications/read-all", { method: "POST", cookie: both });
  assert.equal(readAll.status, 403);

  // The admin keeps their own session for the internal app.
  const internal = await api("/api/users", { cookie: both });
  assert.equal(internal.status, 200);

  const audit = await (await db())
    .collection("teamactivitylogs")
    .findOne({ action: "CLIENT_PORTAL_PREVIEW_STARTED", userId: ID.admin, entityId: ID.clientA });
  assert.ok(audit, "preview start is audited");

  const exit = await api("/api/client/preview/exit", { method: "POST", cookie: both });
  assert.equal(exit.status, 200);
  assert.equal(exit.json.redirectTo, `/clients/${ID.clientA}/portal`);
  const ended = await (await db())
    .collection("teamactivitylogs")
    .findOne({ action: "CLIENT_PORTAL_PREVIEW_ENDED", userId: ID.admin, entityId: ID.clientA });
  assert.ok(ended, "preview end is audited");
});

test("a preview token is never accepted as a login session", async () => {
  const admin = (await login(ACCOUNTS.admin.email)).cookie;
  const { preview } = await startPreview(admin);
  const forged = `dm_session=${preview}`;
  const internal = await api("/api/users", { cookie: forged });
  assert.equal(internal.status, 401);
  const portal = await api("/api/client/dashboard", { cookie: forged });
  assert.equal(portal.status, 401);
});

test("only staff with manage_clients (or admins) can preview", async () => {
  const noPerm = (await login(ACCOUNTS.managerNoPerm.email)).cookie;
  const denied = await startPreview(noPerm);
  assert.equal(denied.res.status, 403);

  const manager = (await login(ACCOUNTS.managerClients.email)).cookie;
  const allowed = await startPreview(manager);
  assert.equal(allowed.res.status, 200);

  const client = (await login(ACCOUNTS.clientA.email)).cookie;
  const clientDenied = await startPreview(client, ID.clientB);
  assert.equal(clientDenied.res.status, 403);
});

test("a preview cookie is bound to the session that created it", async () => {
  const admin = (await login(ACCOUNTS.admin.email)).cookie;
  const { preview } = await startPreview(admin, ID.clientB);

  // A client login carrying someone else's preview cookie still sees only its own client.
  const clientA = (await login(ACCOUNTS.clientA.email)).cookie;
  const withStray = await api("/api/client/profile", { cookie: `${clientA}; dm_client_preview=${preview}` });
  assert.equal(withStray.status, 200);
  assert.equal(withStray.json.client.id, ID.clientA);
  assert.equal(withStray.json.isPreview, false);

  // Another internal user cannot reuse the admin's preview cookie either.
  const manager = (await login(ACCOUNTS.managerNoPerm.email)).cookie;
  const borrowed = await api("/api/client/profile", { cookie: `${manager}; dm_client_preview=${preview}` });
  assert.equal(borrowed.status, 403);

  // The preview cookie alone (no session) grants nothing.
  const alone = await api("/api/client/profile", { cookie: `dm_client_preview=${preview}` });
  assert.equal(alone.status, 401);
});
