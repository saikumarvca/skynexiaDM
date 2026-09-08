import crypto from "crypto";
import { cache } from "react";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { DM_SESSION_COOKIE_NAME } from "@/lib/session-cookie-name";
import type { UserRole } from "@/models/User";

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  agencyId?: string;
  agencyKind?: "MAIN_EMPLOYEE" | "PARTNER_EMPLOYEE";
  /** For CLIENT logins: the client this account is confined to. */
  clientId?: string;
};

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
  const body = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
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

export function getSessionTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(DM_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(DM_SESSION_COOKIE_NAME)?.value ?? null;
}

function getSessionTokenFromCookieHeader(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  // Very small cookie parser (enough for our single cookie).
  const parts = cookieHeader.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (!k) continue;
    if (k === DM_SESSION_COOKIE_NAME) return rest.join("=");
  }
  return null;
}

export function getSessionCookieName() {
  return DM_SESSION_COOKIE_NAME;
}

/** A preview token is not a login; only plain session tokens identify a user. */
function readUserSessionPayload(token: string): SessionPayload {
  const payload = verifySessionToken(token);
  if (!payload || payload.typ) throw new Error("UNAUTHENTICATED");
  return payload;
}

async function loadActiveSessionUserById(userId: string): Promise<SessionUser> {
  await dbConnect();
  const user = await User.findById(userId).select(
    "_id email name role isActive agencyId agencyKind clientId",
  );
  if (!user || !user.isActive) throw new Error("UNAUTHENTICATED");

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    agencyId: user.agencyId?.toString?.(),
    agencyKind: user.agencyKind,
    clientId: user.clientId?.toString?.(),
  };
}

export async function requireUserFromRequest(
  req: NextRequest,
): Promise<SessionUser> {
  const token = getSessionTokenFromRequest(req);
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = readUserSessionPayload(token);
  return loadActiveSessionUserById(payload.uid);
}

export async function requireUserFromCookieHeader(
  cookieHeader: string | null,
): Promise<SessionUser> {
  const token = getSessionTokenFromCookieHeader(cookieHeader);
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = readUserSessionPayload(token);
  return loadActiveSessionUserById(payload.uid);
}

export async function requireUser(): Promise<SessionUser> {
  const token = await getSessionTokenFromCookies();
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = readUserSessionPayload(token);
  return loadActiveSessionUserById(payload.uid);
}

/** One user fetch per request when layout + pages both need the session. */
export const getCachedUser = cache(requireUser);

export function assertAdmin(user: SessionUser) {
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
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
