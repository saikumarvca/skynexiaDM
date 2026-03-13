import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import ReviewUsage from '@/models/ReviewUsage'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const reviewId = searchParams.get('reviewId')

    const query: Record<string, string> = {}
    if (clientId) query.clientId = clientId
    if (reviewId) query.reviewId = reviewId

    const usage = await ReviewUsage.find(query)
      .populate('clientId', 'name businessName')
      .populate('reviewId', 'shortLabel')
      .sort({ usedAt: -1 })

    return NextResponse.json(usage)
  } catch (error) {
    console.error('Error fetching review usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review usage' },
      { status: 500 }
    )
  }
}