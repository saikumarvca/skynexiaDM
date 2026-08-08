import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DM_SESSION_COOKIE_NAME } from "@/lib/session-cookie-name";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8001";

const VALIDATE_TIMEOUT_MS = 5_000;

function isPublicPath(pathname: string) {
  if (pathname === "/login" || pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/portal/")) return true;
  // Static assets served from /public (e.g. /logo.png, /robots.txt) — anything
  // whose last path segment has a file extension. Never gate these behind auth.
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}

function isIntegrationIngestPath(pathname: string) {
  return /^\/api\/integrations\/[^/]+\/ingest$/.test(pathname);
}

async function isValidToken(token: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VALIDATE_TIMEOUT_MS);
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public API routes
  if (pathname.startsWith("/api/")) {
    if (
      pathname === "/api/auth/login" ||
      pathname === "/api/auth/logout" ||
      pathname.startsWith("/api/cron/") ||
      isIntegrationIngestPath(pathname) ||
      pathname === "/api/portal/approvals" ||
      pathname === "/api/portal/comments"
    ) {
      return NextResponse.next();
    }

    const token = req.cookies.get(DM_SESSION_COOKIE_NAME)?.value;

    if (token && (await isValidToken(token))) {
      return NextResponse.next();
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  // Login, Next.js assets, portal pages etc.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(DM_SESSION_COOKIE_NAME)?.value;

  if (token && (await isValidToken(token))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();

  url.pathname = "/login";
  url.searchParams.set("next", pathname);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};