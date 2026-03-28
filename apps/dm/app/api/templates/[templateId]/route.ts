import { NextRequest, NextResponse } from "next/server"
import { requireSessionApi } from "@/lib/require-session-api"
import dbConnect from "@/lib/mongodb"
import Template from "@/models/Template"
import { templatePatchSchema, templateUpsertSchema } from "@/lib/api/schemas"

interface RouteParams {
  params: Promise<{ templateId: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()
    const { templateId } = await params
    const doc = await Template.findById(templateId).lean()
    if (!doc) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    return NextResponse.json(doc)
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request)
    if (denied) return denied

    await dbConnect()
    const { templateId } = await params
    const body = await request.json()
    const parsed = templateUpsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid template", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const doc = await Template.findByIdAndUpdate(
      templateId,
      { ...parsed.data },
      { new: true, runValidators: true }
    ).lean()
    if (!doc) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    return NextResponse.json(doc)
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request)
    if (denied) return denied

    await dbConnect()
    const { templateId } = await params
    const body = await request.json()
    const parsed = templatePatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid template", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }
    const doc = await Template.findByIdAndUpdate(
      templateId,
      { ...parsed.data },
      { new: true, runValidators: true }
    ).lean()
    if (!doc) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    return NextResponse.json(doc)
  } catch (error) {
    console.error("Error patching template:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireSessionApi(request)
    if (denied) return denied

    await dbConnect()
    const { templateId } = await params
    const doc = await Template.findByIdAndUpdate(
      templateId,
      { $set: { isArchived: true } },
      { new: true }
    ).lean()
    if (!doc) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    return NextResponse.json(doc)
  } catch (error) {
    console.error("Error archiving template:", error)
    return NextResponse.json({ error: "Failed to archive template" }, { status: 500 })
  }
}
