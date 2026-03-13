import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'
import ReviewUsage from '@/models/ReviewUsage'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { reviewId, sourceName, usedBy, profileName, usedAt, notes } = await request.json()

    // First, get the review to get clientId
    const review = await Review.findOne({ _id: reviewId })
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Create usage record
    const usage = new ReviewUsage({
      clientId: review.clientId,
      reviewId,
      sourceName,
      usedBy,
      profileName,
      usedAt: new Date(usedAt),
      notes,
    })
    await usage.save()

    // Update review status to USED
    await Review.findOneAndUpdate({ _id: reviewId }, {
      status: 'USED',
      updatedAt: new Date()
    })

    return NextResponse.json({
      message: 'Review marked as used successfully',
      usage,
    })
  } catch (error) {
    console.error('Error marking review as used:', error)
    return NextResponse.json(
      { error: 'Failed to mark review as used' },
      { status: 500 }
    )
  }
}