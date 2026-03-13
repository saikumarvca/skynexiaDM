import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'

interface RouteParams {
  params: { clientId: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()

    const client = await Client.findById(params.clientId)
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()

    const body = await request.json()
    const client = await Client.findByIdAndUpdate(
      params.clientId,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()

    const client = await Client.findByIdAndUpdate(
      params.clientId,
      { status: 'ARCHIVED', updatedAt: new Date() },
      { new: true }
    )

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Client archived successfully' })
  } catch (error) {
    console.error('Error archiving client:', error)
    return NextResponse.json(
      { error: 'Failed to archive client' },
      { status: 500 }
    )
  }
}