/**
 * Signed session / preview tokens for the `dm_session` and `dm_client_preview`
 * cookies: `<base64url(JSON payload)>.<base64url(HMAC-SHA256)>`.
 *
 * This module has no Next.js or database imports so it can be unit-tested on
 * its own. lib/auth.ts re-exports everything here; the edge counterpart in
 * lib/session-edge.ts must stay byte-for-byte compatible with it.
 */
import crypto from "crypto";

function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return secret;
}

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(s: string) {
  const padded =
    s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function sign(input: string) {
  const secret = requireAuthSecret();
  return base64UrlEncode(
    crypto.createHmac("sha256", secret).update(input).digest(),
  );
}

export const CLIENT_PREVIEW_TOKEN_TYPE = "client_preview" as const;

export type SessionPayload = {
  uid: string;
  exp: number; // epoch seconds
  /** Issued-at (epoch seconds); compared with User.sessionsRevokedAt. */
  iat?: number;
  /** Only for CLIENT logins; the edge proxy reads it to confine the session. */
  role?: "CLIENT";
  /** Client id for CLIENT logins (and for client-portal preview tokens). */
  cid?: string;
  /**
   * Token kind. Absent for normal sessions. "client_preview" marks a token
   * that lets an internal user look at the client portal as one client; such
   * tokens are never accepted as a user session.
   */
  typ?: typeof CLIENT_PREVIEW_TOKEN_TYPE;
};

export function createSessionToken(payload: SessionPayload) {
  const withIat: SessionPayload = {
    iat: Math.floor(Date.now() / 1000),
    ...payload,
  };
  const body = base64UrlEncode(Buffer.from(JSON.stringify(withIat), "utf8"));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const json = base64UrlDecode(body).toString("utf8");
    const parsed = JSON.parse(json) as SessionPayload;
    if (!parsed?.uid || !parsed?.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * True when the token was issued before the user's sessions were revoked.
 * Tokens without `iat` (issued before revocation existed) count as old.
 */
export function isSessionRevoked(
  payload: Pick<SessionPayload, "iat">,
  revokedAt: Date | string | null | undefined,
): boolean {
  if (!revokedAt) return false;
  const revokedSec = Math.floor(new Date(revokedAt).getTime() / 1000);
  if (!Number.isFinite(revokedSec)) return false;
  return (payload.iat ?? 0) < revokedSec;
}

/** Lifetime of a client-portal preview cookie. */
export const CLIENT_PREVIEW_MAX_AGE_SECONDS = 60 * 60; // 1 hour

/**
 * Signed, short-lived token that lets the internal user `uid` browse the
 * client portal as client `cid`. It reuses the session HMAC but carries
 * `typ: "client_preview"`, so `requireUser*` never treat it as a login.
 */
export function createClientPreviewToken(params: { uid: string; cid: string }) {
  const exp = Math.floor(Date.now() / 1000) + CLIENT_PREVIEW_MAX_AGE_SECONDS;
  return createSessionToken({
    uid: params.uid,
    cid: params.cid,
    exp,
    role: "CLIENT",
    typ: CLIENT_PREVIEW_TOKEN_TYPE,
  });
}

export function verifyClientPreviewToken(
  token: string,
): { uid: string; cid: string; exp: number } | null {
  const payload = verifySessionToken(token);
  if (!payload || payload.typ !== CLIENT_PREVIEW_TOKEN_TYPE) return null;
  if (!payload.cid) return null;
  return { uid: payload.uid, cid: payload.cid, exp: payload.exp };
}
