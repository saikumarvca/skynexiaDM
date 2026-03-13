import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'
import ReviewUsage from '@/models/ReviewUsage'

interface RouteParams {
  params: { clientId: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()

    const [totalReviews, unusedReviews, usedReviews, totalUsage] = await Promise.all([
      Review.countDocuments({ clientId: params.clientId, status: { $ne: 'ARCHIVED' } }),
      Review.countDocuments({ clientId: params.clientId, status: 'UNUSED' }),
      Review.countDocuments({ clientId: params.clientId, status: 'USED' }),
      ReviewUsage.countDocuments({ clientId: params.clientId }),
    ])

    return NextResponse.json({
      totalReviews,
      unusedReviews,
      usedReviews,
      totalUsage,
    })
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client stats' },
      { status: 500 }
    )
  }
}