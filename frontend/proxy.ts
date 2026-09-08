import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getSessionCookieName,
  readSessionTokenEdge,
} from "@/lib/session-edge";

/** Home of external client logins (role CLIENT). */
const CLIENT_PORTAL_HOME = "/client-portal";

function isPublicPath(pathname: string) {
  if (pathname === "/login" || pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/portal/")) return true;
  return false;
}

/** Only integration webhook ingest bypasses the session cookie (auth via integration API key in the handler). */
function isIntegrationIngestPath(pathname: string) {
  return /^\/api\/integrations\/[^/]+\/ingest$/.test(pathname);
}

/** Pages an external client login may open; everything else returns to the portal. */
function isClientAllowedPage(pathname: string) {
  return (
    pathname === CLIENT_PORTAL_HOME ||
    pathname.startsWith(CLIENT_PORTAL_HOME + "/")
  );
}

/** APIs an external client login may call; each handler also scopes to the client. */
function isClientAllowedApi(pathname: string) {
  return (
    pathname === "/api/auth/logout" ||
    pathname === "/api/review-analytics/daily-progress" ||
    pathname === "/api/settings/password"
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET;
  const token = req.cookies.get(getSessionCookieName())?.value;

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

    const session =
      secret && token ? await readSessionTokenEdge(token, secret) : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role === "CLIENT" && !isClientAllowedApi(pathname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  const session =
    secret && token ? await readSessionTokenEdge(token, secret) : null;
  if (session) {
    if (session.role === "CLIENT" && !isClientAllowedPage(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = CLIENT_PORTAL_HOME;
      url.search = "";
      return NextResponse.redirect(url);
    }
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
