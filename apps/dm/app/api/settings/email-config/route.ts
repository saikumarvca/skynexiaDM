import { NextRequest, NextResponse } from "next/server"
import { requireUserFromRequest } from "@/lib/auth"

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireUserFromRequest(req)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const provider = (process.env.EMAIL_PROVIDER ?? "none").toLowerCase()

  let configured = false
  if (provider === "resend") {
    configured = Boolean(process.env.RESEND_API_KEY)
  } else if (provider === "smtp") {
    configured = Boolean(process.env.SMTP_HOST)
  }

  return NextResponse.json({ provider, configured })
}
