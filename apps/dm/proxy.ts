import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookieName, verifySessionTokenEdge } from "@/lib/session-edge";

function isPublicPath(pathname: string) {
  if (pathname === "/login" || pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/portal/")) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (
      pathname === "/api/auth/login" ||
      pathname === "/api/auth/logout" ||
      pathname.startsWith("/api/cron/")
    ) {
      return NextResponse.next();
    }

    const secret = process.env.AUTH_SECRET;
    const token = req.cookies.get(getSessionCookieName())?.value;
    if (secret && token && (await verifySessionTokenEdge(token, secret))) {
      return NextResponse.next();
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(getSessionCookieName())?.value;
  const secret = process.env.AUTH_SECRET;
  if (token && secret) {
    const ok = await verifySessionTokenEdge(token, secret);
    if (ok) return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};
