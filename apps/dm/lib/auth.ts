import crypto from "crypto";
import { cache } from "react";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { DM_SESSION_COOKIE_NAME } from "@/lib/session-cookie-name";

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: string;
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

type SessionPayload = {
  uid: string;
  exp: number; // epoch seconds
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

export async function requireUserFromRequest(
  req: NextRequest,
): Promise<SessionUser> {
  const token = getSessionTokenFromRequest(req);
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = verifySessionToken(token);
  if (!payload) throw new Error("UNAUTHENTICATED");

  await dbConnect();
  const user = await User.findById(payload.uid).select(
    "_id email name role isActive",
  );
  if (!user || !user.isActive) throw new Error("UNAUTHENTICATED");

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireUserFromCookieHeader(
  cookieHeader: string | null,
): Promise<SessionUser> {
  const token = getSessionTokenFromCookieHeader(cookieHeader);
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = verifySessionToken(token);
  if (!payload) throw new Error("UNAUTHENTICATED");

  await dbConnect();
  const user = await User.findById(payload.uid).select(
    "_id email name role isActive",
  );
  if (!user || !user.isActive) throw new Error("UNAUTHENTICATED");

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const token = await getSessionTokenFromCookies();
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = verifySessionToken(token);
  if (!payload) throw new Error("UNAUTHENTICATED");

  await dbConnect();
  const user = await User.findById(payload.uid).select(
    "_id email name role isActive",
  );
  if (!user || !user.isActive) throw new Error("UNAUTHENTICATED");

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/** One user fetch per request when layout + pages both need the session. */
export const getCachedUser = cache(requireUser);

export function assertAdmin(user: SessionUser) {
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
}
