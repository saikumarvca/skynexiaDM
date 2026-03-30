import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { ApiError, toErrorResponse } from "@/lib/api-errors";
import { setSessionCookie, SESSION_MAX_AGE_SECONDS } from "@/lib/session-cookie";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const { allowed, retryAfter } = await checkRateLimit(ip);
    if (!allowed) {
      return toErrorResponse(
        new ApiError({
          status: 429,
          code: "TOO_MANY_REQUESTS",
          message: "Too many login attempts. Try again later.",
          retryAfter,
        }),
      );
    }

    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return toErrorResponse(
        new ApiError({
          status: 400,
          code: "BAD_REQUEST",
          message: "Email and password are required",
        }),
      );
    }

    await dbConnect();
    const user = await User.findOne({ email }).select(
      "_id email name role passwordHash isActive",
    );
    if (!user || !user.isActive || !user.passwordHash) {
      return toErrorResponse(
        new ApiError({
          status: 401,
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        }),
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return toErrorResponse(
        new ApiError({
          status: 401,
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        }),
      );

    const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
    const token = createSessionToken({ uid: user._id.toString(), exp });

    const res = NextResponse.json({
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error(e);
    return toErrorResponse(e, { fallbackMessage: "Login failed" });
  }
}
