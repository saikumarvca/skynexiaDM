import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNTS, PASSWORD, api, cookieValue, login, page } from "./helpers.mjs";

test("client login: valid credentials create a client session", async () => {
  const { res, body, cookie } = await login(ACCOUNTS.clientA.email, PASSWORD, { portal: "client" });
  assert.equal(res.status, 200);
  assert.equal(body.user?.role, "CLIENT");
  assert.equal(body.redirectTo, "/client/dashboard");
  assert.ok(cookieValue(cookie, "dm_session"), "session cookie set");

  const dash = await page("/client/dashboard", cookie);
  assert.equal(dash.status, 200);
  assert.match(dash.text, /Welcome, Alpha Dental/);

  const profile = await api("/api/client/profile", { cookie });
  assert.equal(profile.status, 200);
  assert.equal(profile.json.client.id, "66a000000000000000000a01");
  assert.equal(profile.json.isPreview, false);
});

test("client login: wrong password is rejected", async () => {
  const { res } = await login(ACCOUNTS.clientA.email, "definitely-wrong", { portal: "client" });
  assert.equal(res.status, 401);
});

test("client login: inactive client user is rejected", async () => {
  const { res } = await login(ACCOUNTS.clientInactive.email, PASSWORD, { portal: "client" });
  assert.equal(res.status, 401);
});

test("client login: internal account cannot sign in through the client portal", async () => {
  const { res, body } = await login(ACCOUNTS.admin.email, PASSWORD, { portal: "client" });
  assert.equal(res.status, 403);
  assert.match(body.error ?? "", /client accounts/i);
});

test("internal session is not a client session", async () => {
  const { cookie } = await login(ACCOUNTS.admin.email);
  const apiRes = await api("/api/client/dashboard", { cookie });
  assert.equal(apiRes.status, 403);

  const pageRes = await page("/client/dashboard", cookie);
  assert.ok([302, 307, 308].includes(pageRes.status), `expected redirect, got ${pageRes.status}`);
  assert.match(pageRes.location ?? "", /\/dashboard$/);
});

test("anonymous requests are redirected to the client sign-in", async () => {
  const apiRes = await api("/api/client/dashboard");
  assert.equal(apiRes.status, 401);

  const pageRes = await page("/client/reviews");
  assert.ok([302, 307, 308].includes(pageRes.status));
  assert.match(pageRes.location ?? "", /\/client\/login\?next=%2Fclient%2Freviews/);
});

test("legacy /client-portal path redirects to the new dashboard", async () => {
  const { cookie } = await login(ACCOUNTS.clientA.email);
  const res = await page("/client-portal", cookie);
  assert.ok([302, 307, 308].includes(res.status));
  assert.match(res.location ?? "", /\/client\/dashboard$/);
});

test("client login via the team sign-in is sent to the client portal", async () => {
  const { res, body } = await login(ACCOUNTS.clientA.email);
  assert.equal(res.status, 200);
  assert.equal(body.redirectTo, "/client/dashboard");
});
