import type { NextRequest, NextResponse } from "next/server";
import {
  CLIENT_PREVIEW_MAX_AGE_SECONDS,
  createClientPreviewToken,
  verifyClientPreviewToken,
} from "@/lib/auth";
import { DM_CLIENT_PREVIEW_COOKIE_NAME } from "@/lib/session-cookie-name";

/**
 * Cookie plumbing for "Preview client portal". The preview cookie sits next
 * to the normal session cookie and is only consulted on /client and
 * /api/client paths (see proxy.ts and lib/client-portal/session.ts).
 */

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function setClientPreviewCookie(
  res: NextResponse,
  params: { uid: string; cid: string },
) {
  const token = createClientPreviewToken(params);
  res.cookies.set(DM_CLIENT_PREVIEW_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: CLIENT_PREVIEW_MAX_AGE_SECONDS,
  });
}

export function clearClientPreviewCookie(res: NextResponse) {
  res.cookies.set(DM_CLIENT_PREVIEW_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export function readClientPreviewFromRequest(req: NextRequest) {
  const token = req.cookies.get(DM_CLIENT_PREVIEW_COOKIE_NAME)?.value;
  return token ? verifyClientPreviewToken(token) : null;
}
