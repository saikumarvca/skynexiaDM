import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DM_CLIENT_PREVIEW_COOKIE_NAME,
  DM_SESSION_COOKIE_NAME,
} from "@/lib/session-cookie-name";
import {
  readClientPreviewEdge,
  readUserSessionEdge,
} from "@/lib/session-edge";

/** Home and sign-in page of the authenticated client portal (role CLIENT). */
const CLIENT_HOME = "/client/dashboard";
const CLIENT_LOGIN = "/client/login";
/** Previous location of the client portal; kept as a redirect. */
const LEGACY_CLIENT_PORTAL = "/client-portal";

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

/** Pages of the authenticated client portal. */
function isClientPortalPage(pathname: string) {
  return pathname === "/client" || pathname.startsWith("/client/");
}

/** APIs of the authenticated client portal; every handler scopes to the client. */
function isClientPortalApi(pathname: string) {
  return pathname.startsWith("/api/client/");
}

function redirectTo(req: NextRequest, pathname: string, next?: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET;
  const token = req.cookies.get(DM_SESSION_COOKIE_NAME)?.value;
  const previewToken = req.cookies.get(DM_CLIENT_PREVIEW_COOKIE_NAME)?.value;

  const readSession = async () =>
    secret && token ? await readUserSessionEdge(token, secret) : null;
  const readPreview = async () =>
    secret && previewToken
      ? await readClientPreviewEdge(previewToken, secret)
      : null;

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

    if (isClientPortalApi(pathname)) {
      // Client portal APIs: a client login, or an internal user in preview.
      if (await readPreview()) return NextResponse.next();
      const session = await readSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (session.role !== "CLIENT") {
        return NextResponse.json(
          { error: "Forbidden: client portal only" },
          { status: 403 },
        );
      }
      return NextResponse.next();
    }

    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Client logins never reach internal APIs.
    if (session.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (
    pathname === LEGACY_CLIENT_PORTAL ||
    pathname.startsWith(LEGACY_CLIENT_PORTAL + "/")
  ) {
    return redirectTo(req, CLIENT_HOME);
  }

  if (pathname === CLIENT_LOGIN) {
    const session = await readSession();
    if (session?.role === "CLIENT") return redirectTo(req, CLIENT_HOME);
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  if (isClientPortalPage(pathname)) {
    if (await readPreview()) return NextResponse.next();
    const session = await readSession();
    if (!session) return redirectTo(req, CLIENT_LOGIN, pathname);
    if (session.role !== "CLIENT") {
      // Internal users open the portal through "Preview client portal".
      return redirectTo(req, "/dashboard");
    }
    return NextResponse.next();
  }

  const session = await readSession();
  if (session) {
    if (session.role === "CLIENT") return redirectTo(req, CLIENT_HOME);
    return NextResponse.next();
  }

  return redirectTo(req, "/login", pathname);
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};
