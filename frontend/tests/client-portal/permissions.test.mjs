import { test, before } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, FIXTURE_IDS as ID, api, login, page } from "./helpers.mjs";

let cookieA = "";
before(async () => {
  cookieA = (await login(ACCOUNTS.clientA.email)).cookie;
});

const INTERNAL_APIS = [
  "/api/team/members",
  "/api/team/roles",
  "/api/clients",
  `/api/clients/${ID.clientA}`,
  "/api/users",
  "/api/integrations",
  "/api/review-drafts",
  "/api/review-allocations",
  "/api/dashboard/stats",
  "/api/notifications",
  "/api/export/all-data",
  "/api/review-analytics/daily-progress",
];

test("client session is forbidden on every internal API", async () => {
  for (const path of INTERNAL_APIS) {
    const res = await api(path, { cookie: cookieA });
    assert.equal(res.status, 403, `${path} should be 403, got ${res.status}`);
  }
});

test("client session cannot use the internal password or settings endpoints", async () => {
  const res = await api("/api/settings/password", {
    method: "POST",
    cookie: cookieA,
    body: { currentPassword: "x", newPassword: "yyyyyyyy" },
  });
  assert.equal(res.status, 403);
});

test("client session cannot manage any client portal (staff APIs)", async () => {
  const preview = await api(`/api/clients/${ID.clientA}/portal/preview`, { method: "POST", cookie: cookieA });
  assert.equal(preview.status, 403);
  const updates = await api(`/api/clients/${ID.clientA}/portal/updates`, { cookie: cookieA });
  assert.equal(updates.status, 403);
  const backfill = await api("/api/admin/client-events/backfill", { method: "POST", cookie: cookieA });
  assert.equal(backfill.status, 403);
});

test("client session is redirected away from internal pages", async () => {
  for (const path of ["/dashboard", "/dashboard/admin/users", "/clients", `/clients/${ID.clientA}`, "/team"]) {
    const res = await page(path, cookieA);
    assert.ok([302, 307, 308].includes(res.status), `${path} should redirect, got ${res.status}`);
    assert.match(res.location ?? "", /\/client\/dashboard$/);
  }
});

test("staff without manage_clients cannot manage the portal; account managers can", async () => {
  const noPerm = (await login(ACCOUNTS.managerNoPerm.email)).cookie;
  const denied = await api(`/api/clients/${ID.clientA}/portal/updates`, { cookie: noPerm });
  assert.equal(denied.status, 403);

  const manager = (await login(ACCOUNTS.managerClients.email)).cookie;
  const allowed = await api(`/api/clients/${ID.clientA}/portal/updates`, { cookie: manager });
  assert.equal(allowed.status, 200);
});
