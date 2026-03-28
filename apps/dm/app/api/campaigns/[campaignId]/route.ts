import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { requireSessionApi } from "@/lib/require-session-api"
import dbConnect from "@/lib/mongodb"
import Campaign from "@/models/Campaign"
import type { CampaignStatus } from "@/models/Campaign"

const STATUSES: CampaignStatus[] = [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
]

function isStatus(s: unknown): s is CampaignStatus {
  return typeof s === "string" && STATUSES.includes(s as CampaignStatus)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 })
    }
    await dbConnect()
    const doc = await Campaign.findById(campaignId)
      .populate("clientId", "name businessName")
      .lean()
    if (!doc) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }
    return NextResponse.json(JSON.parse(JSON.stringify(doc)))
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const denied = await requireSessionApi(request)
    if (denied) return denied

    const { campaignId } = await params
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 })
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    await dbConnect()

    const existing = await Campaign.findById(campaignId)
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const set: Record<string, unknown> = {}

    if (typeof body.clientId === "string" && mongoose.Types.ObjectId.isValid(body.clientId)) {
      set.clientId = new mongoose.Types.ObjectId(body.clientId)
    }
    if (typeof body.campaignName === "string") {
      const t = body.campaignName.trim()
      if (t) set.campaignName = t
    }
    if (typeof body.platform === "string") {
      const t = body.platform.trim()
      if (t) set.platform = t
    }
    if (body.objective !== undefined) {
      set.objective =
        typeof body.objective === "string" && body.objective.trim() ? body.objective.trim() : undefined
    }
    if (body.notes !== undefined) {
      set.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined
    }
    if (body.budget !== undefined && body.budget !== null && body.budget !== "") {
      const n = Number(body.budget)
      if (Number.isFinite(n) && n >= 0) set.budget = n
    } else if (body.budget === null || body.budget === "") {
      set.budget = undefined
    }
    if (body.startDate !== undefined) {
      if (body.startDate === null || body.startDate === "") {
        set.startDate = undefined
      } else if (typeof body.startDate === "string") {
        const d = new Date(body.startDate)
        if (!Number.isNaN(d.getTime())) set.startDate = d
      }
    }
    if (body.endDate !== undefined) {
      if (body.endDate === null || body.endDate === "") {
        set.endDate = undefined
      } else if (typeof body.endDate === "string") {
        const d = new Date(body.endDate)
        if (!Number.isNaN(d.getTime())) set.endDate = d
      }
    }
    if (body.status !== undefined) {
      if (!isStatus(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      set.status = body.status
    }

    if (body.metrics !== undefined && body.metrics !== null && typeof body.metrics === "object") {
      const m = body.metrics as Record<string, unknown>
      const num = (v: unknown): number | undefined => {
        if (v === null || v === undefined || v === "") return undefined
        const n = Number(v)
        return Number.isFinite(n) ? n : undefined
      }
      const prev = existing.metrics
        ? (existing.toObject().metrics as Record<string, number | undefined>)
        : {}
      const next = {
        impressions: num(m.impressions) ?? prev.impressions ?? 0,
        clicks: num(m.clicks) ?? prev.clicks ?? 0,
        ctr: num(m.ctr) ?? prev.ctr ?? 0,
        leads: num(m.leads) ?? prev.leads ?? 0,
        conversions: num(m.conversions) ?? prev.conversions ?? 0,
        costPerLead: num(m.costPerLead) ?? prev.costPerLead ?? 0,
        conversionRate: num(m.conversionRate) ?? prev.conversionRate ?? 0,
      }
      set.metrics = next
    }

    if (Object.keys(set).length === 0) {
      const unchanged = await Campaign.findById(campaignId)
        .populate("clientId", "name businessName")
        .lean()
      return NextResponse.json(JSON.parse(JSON.stringify(unchanged)))
    }

    const updated = await Campaign.findByIdAndUpdate(campaignId, { $set: set }, { new: true })
      .populate("clientId", "name businessName")
      .lean()

    return NextResponse.json(JSON.parse(JSON.stringify(updated)))
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
  }
}
