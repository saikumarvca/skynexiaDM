import { NextRequest, NextResponse } from "next/server"
import { requireUserFromRequest } from "@/lib/auth"

export function jsonUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

/** Returns 401 response if the request has no valid session; otherwise null. */
export async function requireSessionApi(request: NextRequest): Promise<NextResponse | null> {
  try {
    await requireUserFromRequest(request)
    return null
  } catch {
    return jsonUnauthorized()
  }
}
