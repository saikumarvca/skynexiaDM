import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { requireUserFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    const sessionUser = await requireUserFromRequest(request);
    return NextResponse.json({
      name: sessionUser.name,
      email: sessionUser.email,
      role: sessionUser.role,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    const sessionUser = await requireUserFromRequest(request);

    const body = (await request.json()) as { name?: string };
    const name = (body.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await dbConnect();
    await User.findByIdAndUpdate(sessionUser.userId, { name });

    return NextResponse.json({
      name,
      email: sessionUser.email,
      role: sessionUser.role,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
