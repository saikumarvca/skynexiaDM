import { cache } from "react";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { DM_SESSION_COOKIE_NAME } from "@/lib/session-cookie-name";
import type { UserRole } from "@/models/User";
import { verifySessionToken, type SessionPayload } from "@/lib/session-token";

// Token signing lives in lib/session-token.ts (no Next/DB imports, unit-tested).
export {
  CLIENT_PREVIEW_MAX_AGE_SECONDS,
  CLIENT_PREVIEW_TOKEN_TYPE,
  createClientPreviewToken,
  createSessionToken,
  verifyClientPreviewToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session-token";

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
