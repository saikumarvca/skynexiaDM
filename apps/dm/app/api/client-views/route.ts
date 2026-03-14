import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import ClientView from '@/models/ClientView'

export async function GET() {
  try {
    await dbConnect()
    const views = await ClientView.find().sort({ createdAt: -1 })
    return NextResponse.json(views)
  } catch (error) {
    console.error('Error fetching client views:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client views' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const view = new ClientView({
      name: body.name,
      ownerId: body.ownerId || null,
      filters: body.filters || {},
    })

    await view.save()

    return NextResponse.json(view, { status: 201 })
  } catch (error) {
    console.error('Error creating client view:', error)
    return NextResponse.json(
      { error: 'Failed to create client view' },
      { status: 500 }
    )
  }
}

