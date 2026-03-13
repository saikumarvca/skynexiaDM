import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'

interface RouteParams {
  params: Promise<{ clientId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()

    const { clientId } = await params
    const client = await Client.findOne({ _id: clientId })
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

    const { clientId } = await params
    const body = await request.json()
    const client = await Client.findOneAndUpdate(
      { _id: clientId },
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

    const { clientId } = await params
    const client = await Client.findOneAndUpdate(
      { _id: clientId },
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