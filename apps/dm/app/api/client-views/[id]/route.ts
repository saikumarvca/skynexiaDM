import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import ClientView from '@/models/ClientView'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()
    const { id } = await params
    await ClientView.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client view:', error)
    return NextResponse.json(
      { error: 'Failed to delete client view' },
      { status: 500 }
    )
  }
}

