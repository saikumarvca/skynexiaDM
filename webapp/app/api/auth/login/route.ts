import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8001";

const LOGIN_TIMEOUT_MS = 10_000;

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

  try {
    const body = await request.json();

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        data,
        { status: backendResponse.status },
      );
    }

    if (!data.token) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication token was not returned",
        },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: data.user,
    });

    response.cookies.set({
      name: "skynexiadm_token",
      value: data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Match the backend JWT lifetime (24h) so the cookie never outlives the token.
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication server timed out. Please try again.",
        },
        { status: 504 },
      );
    }

    console.error("Login proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to authentication server",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}