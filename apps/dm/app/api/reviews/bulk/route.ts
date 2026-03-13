import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { clientId, reviews, category, language, ratingStyle } = await request.json()

    // Split reviews by line breaks or paragraphs
    const reviewTexts = reviews
      .split(/\n\s*\n|\n/)
      .map((text: string) => text.trim())
      .filter((text: string) => text.length > 0)

    const reviewDocuments = reviewTexts.map((reviewText: string, index: number) => ({
      clientId,
      shortLabel: `Review ${index + 1}`,
      reviewText,
      category,
      language,
      ratingStyle,
      status: 'UNUSED',
    }))

    const createdReviews = await Review.insertMany(reviewDocuments)

    return NextResponse.json({
      message: `Created ${createdReviews.length} reviews`,
      count: createdReviews.length,
      reviews: createdReviews,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating bulk reviews:', error)
    return NextResponse.json(
      { error: 'Failed to create bulk reviews' },
      { status: 500 }
    )
  }
}