import { NextRequest, NextResponse } from 'next/server'
import { requireSessionApi } from '@/lib/require-session-api'
import dbConnect from '@/lib/mongodb'
import Template from '@/models/Template'
import { templateUpsertSchema } from '@/lib/api/schemas'

export async function GET() {
  try {
    await dbConnect()
    const templates = await Template.find().sort({ name: 1 })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request)
    if (denied) return denied

    await dbConnect()
    const body = await request.json()
    const parsed = templateUpsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid template', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const template = new Template(parsed.data)
    await template.save()
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

