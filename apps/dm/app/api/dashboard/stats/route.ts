import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import Review from '@/models/Review'

export async function GET() {
  try {
    await dbConnect()

    const [totalClients, totalReviews, unusedReviews, usedReviews] = await Promise.all([
      Client.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      Review.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      Review.countDocuments({ status: 'UNUSED' }),
      Review.countDocuments({ status: 'USED' }),
    ])

    return NextResponse.json({
      totalClients,
      totalReviews,
      unusedReviews,
      usedReviews,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}