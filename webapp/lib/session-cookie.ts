import type { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/** Clears the auth cookie (used on logout). The JWT itself lives in the cookie
 *  value; removing it is sufficient to end the session for the browser. */
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
