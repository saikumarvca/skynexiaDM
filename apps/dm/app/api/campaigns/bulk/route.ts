import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { requireSessionApi } from "@/lib/require-session-api"
import dbConnect from "@/lib/mongodb"
import Campaign from "@/models/Campaign"
import type { CampaignStatus } from "@/models/Campaign"

const VALID_STATUSES: CampaignStatus[] = [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]

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

    // Validate all ids are valid ObjectIds
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid campaign ids provided" }, { status: 400 })
    }

    await dbConnect()

    if (action === "delete") {
      return NextResponse.json(
        {
          error:
            "Campaigns cannot be deleted. Use action \"update-status\" with status ARCHIVED instead.",
        },
        { status: 405 }
      )
    }

    if (action === "update-status") {
      if (!status || !VALID_STATUSES.includes(status as CampaignStatus)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        )
      }
      const result = await Campaign.updateMany(
        { _id: { $in: validIds } },
        { $set: { status } }
      )
      return NextResponse.json({ updated: result.modifiedCount })
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "update-status"' },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error in campaigns bulk action:", error)
    return NextResponse.json({ error: "Bulk action failed" }, { status: 500 })
  }
}
