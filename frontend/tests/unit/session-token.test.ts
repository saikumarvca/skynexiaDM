/**
 * Session / preview token signing. Covers the Node signer (lib/session-token)
 * and the edge verifier (lib/session-edge) and, crucially, that they agree.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  CLIENT_PREVIEW_MAX_AGE_SECONDS,
  createClientPreviewToken,
  createSessionToken,
  isSessionRevoked,
  verifyClientPreviewToken,
  verifySessionToken,
} from "@/lib/session-token";
import {
  readClientPreviewEdge,
  readSessionTokenEdge,
  readUserSessionEdge,
} from "@/lib/session-edge";

const SECRET = "unit-test-secret-0123456789-abcdefghijklmnop";
const OTHER_SECRET = "a-different-secret-0123456789-abcdefghijklmn";
const nowSec = () => Math.floor(Date.now() / 1000);
const UID = "66a0000000000000000000a1";
const CID = "66a000000000000000000a01";

beforeEach(() => {
  process.env.AUTH_SECRET = SECRET;
});

describe("createSessionToken / verifySessionToken", () => {
  test("round-trips a payload", () => {
    const token = createSessionToken({ uid: UID, exp: nowSec() + 60 });
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "base64url body.sig, no padding");
    const payload = verifySessionToken(token);
    assert.equal(payload?.uid, UID);
    assert.equal(payload?.typ, undefined);
  });

  test("rejects an expired token", () => {
    const token = createSessionToken({ uid: UID, exp: nowSec() - 1 });
    assert.equal(verifySessionToken(token), null);
    const boundary = createSessionToken({ uid: UID, exp: nowSec() });
    assert.equal(verifySessionToken(boundary), null, "exp equal to now is expired");
  });

  test("rejects a token whose payload was edited", () => {
    const token = createSessionToken({ uid: UID, exp: nowSec() + 60 });
    const [, sig] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ uid: "66a0000000000000000000ff", exp: nowSec() + 60 }))
      .toString("base64url");
    assert.equal(verifySessionToken(`${forgedBody}.${sig}`), null);
  });

  test("rejects a token whose signature was altered or truncated", () => {
    const token = createSessionToken({ uid: UID, exp: nowSec() + 60 });
    const [body, sig] = token.split(".");
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    assert.equal(verifySessionToken(`${body}.${flipped}`), null);
    assert.equal(verifySessionToken(`${body}.${sig.slice(0, -1)}`), null);
    assert.equal(verifySessionToken(`${body}.`), null);
    assert.equal(verifySessionToken(body), null);
    assert.equal(verifySessionToken(""), null);
  });

  test("rejects a token signed with another secret", () => {
    process.env.AUTH_SECRET = OTHER_SECRET;
    const token = createSessionToken({ uid: UID, exp: nowSec() + 60 });
    process.env.AUTH_SECRET = SECRET;
    assert.equal(verifySessionToken(token), null);
  });

  test("rejects a well-signed token with a malformed payload", () => {
    const token = createSessionToken({ uid: "", exp: nowSec() + 60 });
    assert.equal(verifySessionToken(token), null, "empty uid");
    const noExp = createSessionToken({ uid: UID } as never);
    assert.equal(verifySessionToken(noExp), null, "missing exp");
  });

  test("throws when AUTH_SECRET is not configured", () => {
    delete process.env.AUTH_SECRET;
    assert.throws(() => createSessionToken({ uid: UID, exp: nowSec() + 60 }), /AUTH_SECRET/);
  });
});

describe("client preview tokens", () => {
  test("carry uid, cid, typ and a one-hour expiry", () => {
    const token = createClientPreviewToken({ uid: UID, cid: CID });
    const claims = verifyClientPreviewToken(token);
    assert.equal(claims?.uid, UID);
    assert.equal(claims?.cid, CID);
    const ttl = (claims?.exp ?? 0) - nowSec();
    assert.ok(ttl > CLIENT_PREVIEW_MAX_AGE_SECONDS - 5 && ttl <= CLIENT_PREVIEW_MAX_AGE_SECONDS);
  });

  test("a plain session token is not a preview token", () => {
    const token = createSessionToken({ uid: UID, cid: CID, exp: nowSec() + 60, role: "CLIENT" });
    assert.equal(verifyClientPreviewToken(token), null);
  });

  test("a preview token without a cid is not accepted", () => {
    const token = createSessionToken({ uid: UID, exp: nowSec() + 60, typ: "client_preview" });
    assert.equal(verifyClientPreviewToken(token), null);
  });
});

describe("edge verifier agrees with the Node signer", () => {
  test("accepts a Node-signed session token and reads the same claims", async () => {
    const token = createSessionToken({ uid: UID, exp: nowSec() + 60, role: "CLIENT", cid: CID });
    const edge = await readSessionTokenEdge(token, SECRET);
    const node = verifySessionToken(token);
    assert.ok(edge && node);
    for (const key of ["uid", "exp", "role", "cid", "typ"] as const) {
      assert.equal(edge[key], node[key], key);
    }
    assert.ok(await readUserSessionEdge(token, SECRET));
  });

  test("rejects tampering, expiry and a wrong secret like the Node verifier", async () => {
    const valid = createSessionToken({ uid: UID, exp: nowSec() + 60 });
    const [body, sig] = valid.split(".");
    assert.equal(await readSessionTokenEdge(`${body}.${sig.slice(0, -2)}xx`, SECRET), null);
    assert.equal(await readSessionTokenEdge(valid, OTHER_SECRET), null);
    assert.equal(await readSessionTokenEdge("not-a-token", SECRET), null);
    const expired = createSessionToken({ uid: UID, exp: nowSec() - 1 });
    assert.equal(await readSessionTokenEdge(expired, SECRET), null);
  });

  test("a preview token is never a user session, on either side", async () => {
    const preview = createClientPreviewToken({ uid: UID, cid: CID });
    assert.equal(await readUserSessionEdge(preview, SECRET), null);
    assert.deepEqual(await readClientPreviewEdge(preview, SECRET), { uid: UID, cid: CID });

    const session = createSessionToken({ uid: UID, exp: nowSec() + 60 });
    assert.equal(await readClientPreviewEdge(session, SECRET), null);
  });
});

describe("issued-at and revocation", () => {
  test("new tokens carry iat = now; an explicit iat is kept", () => {
    const before = nowSec();
    const payload = verifySessionToken(createSessionToken({ uid: UID, exp: nowSec() + 60 }));
    assert.ok(payload?.iat !== undefined && payload.iat >= before && payload.iat <= nowSec());
    const pinned = verifySessionToken(createSessionToken({ uid: UID, exp: nowSec() + 60, iat: 1_700_000_000 }));
    assert.equal(pinned?.iat, 1_700_000_000);
  });

  test("isSessionRevoked compares iat with the revocation instant", () => {
    const revokedAt = new Date("2026-03-15T12:00:00.500Z");
    const revokedSec = Math.floor(revokedAt.getTime() / 1000);
    assert.equal(isSessionRevoked({ iat: revokedSec - 1 }, revokedAt), true, "older token");
    assert.equal(isSessionRevoked({ iat: revokedSec }, revokedAt), false, "same second survives (fresh cookie)");
    assert.equal(isSessionRevoked({ iat: revokedSec + 1 }, revokedAt), false, "newer token");
    assert.equal(isSessionRevoked({}, revokedAt), true, "legacy token without iat counts as old");
    assert.equal(isSessionRevoked({}, null), false);
    assert.equal(isSessionRevoked({ iat: 1 }, undefined), false);
    assert.equal(isSessionRevoked({ iat: 1 }, revokedAt.toISOString()), true, "accepts an ISO string");
    assert.equal(isSessionRevoked({ iat: 1 }, "not a date"), false, "garbage never locks anyone out");
  });

  test("the edge verifier surfaces iat", async () => {
    const token = createSessionToken({ uid: UID, exp: nowSec() + 60, iat: 1_700_000_000 });
    assert.equal((await readSessionTokenEdge(token, SECRET))?.iat, 1_700_000_000);
  });
});
