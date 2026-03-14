import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import ClientView from '@/models/ClientView'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const viewId = searchParams.get('viewId')

    let baseQuery: Record<string, unknown> = {}
    if (search) {
      baseQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { businessName: { $regex: search, $options: 'i' } },
          { brandName: { $regex: search, $options: 'i' } },
          { contactName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      }
    }

    let filters: Record<string, unknown> = {}
    if (viewId) {
      const view = await ClientView.findById(viewId)
      if (view) {
        filters = view.filters as Record<string, unknown>
      }
    }

    const query = { ...filters, ...baseQuery }

    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const client = new Client(body)
    await client.save()

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}