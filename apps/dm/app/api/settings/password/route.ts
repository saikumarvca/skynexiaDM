import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { requireSessionApi } from "@/lib/require-session-api"
import { requireUserFromRequest } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  const denied = await requireSessionApi(request)
  if (denied) return denied

  try {
    const sessionUser = await requireUserFromRequest(request)

    const body = (await request.json()) as {
      currentPassword?: string
      newPassword?: string
    }

    const currentPassword = body.currentPassword ?? ""
    const newPassword = body.newPassword ?? ""

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "currentPassword and newPassword are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      )
    }

    await dbConnect()
    const user = await User.findById(sessionUser.userId).select("passwordHash")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "No password set for this account" },
        { status: 400 }
      )
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordMatches) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)
    await User.findByIdAndUpdate(sessionUser.userId, { passwordHash: newPasswordHash })

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
