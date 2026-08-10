import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import { getSocialPlatformStatus } from "@/lib/social-publishing";

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  const status = getSocialPlatformStatus();
  return NextResponse.json(status);
}
