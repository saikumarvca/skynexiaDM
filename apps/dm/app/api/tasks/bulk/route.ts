import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { requireSessionApi } from "@/lib/require-session-api"
import dbConnect from "@/lib/mongodb"
import Task from "@/models/Task"
import type { TaskStatus } from "@/models/Task"

const VALID_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "ARCHIVED"]

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request)
    if (denied) return denied

    const body = (await request.json().catch(() => null)) as {
      action: string
      ids: string[]
      status?: string
    } | null

    if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { action, ids, status } = body

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid task ids provided" }, { status: 400 })
    }

    await dbConnect()

    if (action === "archive") {
      const result = await Task.updateMany(
        { _id: { $in: validIds } },
        { $set: { status: "ARCHIVED" } }
      )
      return NextResponse.json({ archived: result.modifiedCount })
    }

    if (action === "update-status") {
      if (!status || !VALID_STATUSES.includes(status as TaskStatus)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        )
      }
      const result = await Task.updateMany(
        { _id: { $in: validIds } },
        { $set: { status } }
      )
      return NextResponse.json({ updated: result.modifiedCount })
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "archive" or "update-status"' },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error in tasks bulk action:", error)
    return NextResponse.json({ error: "Bulk action failed" }, { status: 500 })
  }
}
