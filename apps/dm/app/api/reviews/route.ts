import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const query: Record<string, unknown> = {}
    if (clientId) query.clientId = clientId
    if (status) query.status = status
    if (search) {
      query.$or = [
        { shortLabel: { $regex: search, $options: 'i' } },
        { reviewText: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }

    const reviews = await Review.find(query)
      .populate('clientId', 'name businessName')
      .sort({ createdAt: -1 })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const review = new Review(body)
    await review.save()

    const populatedReview = await Review.findOne({ _id: review._id }).populate('clientId', 'name businessName')

    return NextResponse.json(populatedReview, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}