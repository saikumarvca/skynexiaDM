import type { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function setSessionCookie(res: NextResponse, token: string) {
  const maxAge = SESSION_MAX_AGE_SECONDS;
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

