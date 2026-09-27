/**
 * Edge cases an attacker or a sloppy client would hit: forged and expired
 * cookies, out-of-range paging, unknown filter values, oversized search
 * queries and the login rate limit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { ACCOUNTS, BASE_URL, FIXTURE_IDS as ID, api, assertRedirect, login, page } from "./helpers.mjs";

const AUTH_SECRET = process.env.AUTH_SECRET;

/** Mirrors lib/session-token.ts so the suite can mint tokens the app did not issue. */
function signToken(payload) {
  const b64 = (buf) => buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const body = b64(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64(crypto.createHmac("sha256", AUTH_SECRET).update(body).digest());
  return `${body}.${sig}`;
}
const nowSec = () => Math.floor(Date.now() / 1000);

test("garbage and unsigned session cookies are rejected", async () => {
  for (const cookie of [
    "dm_session=garbage",
    "dm_session=",
    `dm_session=${Buffer.from(JSON.stringify({ uid: ID.clientAUser, exp: nowSec() + 600 })).toString("base64url")}.`,
    `dm_session=${Buffer.from(JSON.stringify({ uid: ID.clientAUser, exp: nowSec() + 600 })).toString("base64url")}.AAAA`,
  ]) {
    assert.equal((await api("/api/client/dashboard", { cookie })).status, 401, cookie);
    assertRedirect(await page("/client/dashboard", cookie), /\/client\/login/, cookie);
  }
});

test("a correctly signed but expired or orphaned token is rejected", { skip: !AUTH_SECRET && "AUTH_SECRET not set" }, async () => {
  const expired = `dm_session=${signToken({ uid: ID.clientAUser, cid: ID.clientA, role: "CLIENT", exp: nowSec() - 5 })}`;
  assert.equal((await api("/api/client/dashboard", { cookie: expired })).status, 401);
  assertRedirect(await page("/client/reviews", expired), /\/client\/login/);

  const orphan = `dm_session=${signToken({ uid: "66a0000000000000000fffff", cid: ID.clientA, role: "CLIENT", exp: nowSec() + 600 })}`;
  assert.equal((await api("/api/client/dashboard", { cookie: orphan })).status, 401);

  // Claims in the token do not override the user record: a CLIENT token
  // naming another client still resolves to the user's own client.
  const wrongCid = `dm_session=${signToken({ uid: ID.clientAUser, cid: ID.clientB, role: "CLIENT", exp: nowSec() + 600 })}`;
  const profile = await api("/api/client/profile", { cookie: wrongCid });
  assert.equal(profile.status, 200);
  assert.equal(profile.json.client.id, ID.clientA);
});

test("paging parameters are clamped rather than trusted", async () => {
  const cookie = (await login(ACCOUNTS.clientA.email)).cookie;
  const huge = await api("/api/client/change-log?pageSize=100000&page=0", { cookie });
  assert.equal(huge.status, 200);
  assert.equal(huge.json.pageSize, 100);
  assert.equal(huge.json.page, 1);

  const junk = await api("/api/client/reviews?page=abc&pageSize=-3", { cookie });
  assert.equal(junk.status, 200);
  assert.equal(junk.json.page, 1);
  assert.equal(junk.json.pageSize, 20);

  const beyond = await api("/api/client/reviews?page=999", { cookie });
  assert.equal(beyond.status, 200);
  assert.deepEqual(beyond.json.items, []);
  assert.equal(beyond.json.total, 3, "total is unaffected by the page");
});

test("review filters: status is case-insensitive, unknown values are ignored, search and platform narrow", async () => {
  const cookie = (await login(ACCOUNTS.clientA.email)).cookie;
  const posted = await api("/api/client/reviews?status=posted", { cookie });
  assert.deepEqual(posted.json.items.map((r) => r.id), [ID.allocA1]);

  const bogus = await api("/api/client/reviews?status=BOGUS", { cookie });
  assert.equal(bogus.json.total, 3);

  const google = await api("/api/client/reviews?platform=google", { cookie });
  assert.ok(google.json.items.length >= 1);
  assert.ok(google.json.items.every((r) => r.platform === "Google"));
  assert.deepEqual(google.json.platforms, ["Google"]);

  const search = await api("/api/client/reviews?search=ramesh", { cookie });
  assert.deepEqual(search.json.items.map((r) => r.id), [ID.allocA1]);
  const none = await api("/api/client/reviews?search=zzz-no-such-review", { cookie });
  assert.deepEqual(none.json.items, []);

  const badRange = await api("/api/client/reviews?range=custom&from=nope&to=2026-02-30", { cookie });
  assert.equal(badRange.status, 200, "malformed dates fall back instead of failing");
});

test("change-log filters ignore unknown categories and roles", async () => {
  const cookie = (await login(ACCOUNTS.clientA.email)).cookie;
  const all = await api("/api/client/change-log", { cookie });
  const filtered = await api("/api/client/change-log?category=bogus&role=nobody", { cookie });
  assert.equal(filtered.status, 200);
  assert.equal(filtered.json.total, all.json.total);
});

test("search: short queries return nothing, long queries are truncated", async () => {
  const cookie = (await login(ACCOUNTS.clientA.email)).cookie;
  const short = await api("/api/client/search?q=r", { cookie });
  assert.equal(short.status, 200);
  assert.deepEqual([short.json.reviews, short.json.updates, short.json.activity], [[], [], []]);

  const long = await api(`/api/client/search?q=${"a".repeat(500)}`, { cookie });
  assert.equal(long.status, 200);
  assert.equal(long.json.query.length, 100);

  const regex = await api("/api/client/search?q=.*(", { cookie });
  assert.equal(regex.status, 200, "regex metacharacters are escaped, not executed");
});

test("unsupported methods on portal routes are 405, not silently accepted", async () => {
  const cookie = (await login(ACCOUNTS.clientA.email)).cookie;
  const res = await api("/api/client/profile", { method: "DELETE", cookie });
  assert.equal(res.status, 405);
});

test("login is rate limited per client address", async () => {
  const limit = Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || 10);
  const headers = { "x-forwarded-for": `203.0.113.${(Date.now() % 250) + 1}` };
  const attempt = () =>
    fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ email: "nobody@test.local", password: "x" }),
      redirect: "manual",
    });

  // Use up the allowance in modest batches so the server is not flooded.
  for (let sent = 0; sent < limit; sent += 25) {
    const batch = Math.min(25, limit - sent);
    const results = await Promise.all(Array.from({ length: batch }, attempt));
    assert.ok(results.every((r) => r.status === 401), `attempts ${sent}-${sent + batch} are plain 401s`);
  }
  const blocked = await attempt();
  assert.equal(blocked.status, 429);
  const body = await blocked.json();
  assert.ok(Number(body.retryAfter ?? blocked.headers.get("retry-after")) > 0, "tells the caller when to retry");

  // Other addresses are unaffected.
  const other = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.7" },
    body: JSON.stringify({ email: "nobody@test.local", password: "x" }),
    redirect: "manual",
  });
  assert.equal(other.status, 401);
});
