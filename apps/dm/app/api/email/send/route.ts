import { NextRequest, NextResponse } from "next/server"
import { requireUserFromRequest } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireUserFromRequest(req)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { to?: unknown; subject?: unknown; html?: unknown; text?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { to, subject, html, text } = body

  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: "to is required and must be a string" }, { status: 400 })
  }
  if (!subject || typeof subject !== "string") {
    return NextResponse.json({ error: "subject is required" }, { status: 400 })
  }
  if (!html || typeof html !== "string") {
    return NextResponse.json({ error: "html is required" }, { status: 400 })
  }

  const result = await sendEmail({
    to,
    subject,
    html,
    text: typeof text === "string" ? text : undefined,
  })

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
