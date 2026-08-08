import { cache } from "react";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { DM_SESSION_COOKIE_NAME } from "@/lib/session-cookie-name";

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  agencyId?: string;
  agencyKind?: "MAIN_EMPLOYEE" | "PARTNER_EMPLOYEE";
};

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8001";

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

  const parts = cookieHeader.split(";");

  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");

    if (key === DM_SESSION_COOKIE_NAME) {
      return rest.join("=");
    }
  }

  return null;
}

export function getSessionCookieName() {
  return DM_SESSION_COOKIE_NAME;
}

async function loadUserFromGoBackend(token: string): Promise<SessionUser> {
  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("UNAUTHENTICATED");
  }

  const data = await response.json();

  const user = data.user;

  if (!user || !user.is_active) {
    throw new Error("UNAUTHENTICATED");
  }

  // The Go backend is the authority on role. Default to the least-privileged
  // role if it is ever absent — never silently grant ADMIN.
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    isActive: user.is_active,
    agencyId: user.agency_id ?? undefined,
    agencyKind: user.agency_kind ?? undefined,
  };
}

export async function requireUserFromRequest(
  req: NextRequest,
): Promise<SessionUser> {
  const token = getSessionTokenFromRequest(req);

  if (!token) {
    throw new Error("UNAUTHENTICATED");
  }

  return loadUserFromGoBackend(token);
}

export async function requireUserFromCookieHeader(
  cookieHeader: string | null,
): Promise<SessionUser> {
  const token = getSessionTokenFromCookieHeader(cookieHeader);

  if (!token) {
    throw new Error("UNAUTHENTICATED");
  }

  return loadUserFromGoBackend(token);
}

export async function requireUser(): Promise<SessionUser> {
  const token = await getSessionTokenFromCookies();

  if (!token) {
    throw new Error("UNAUTHENTICATED");
  }

  return loadUserFromGoBackend(token);
}

export const getCachedUser = cache(requireUser);

export function assertAdmin(user: SessionUser) {
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
}