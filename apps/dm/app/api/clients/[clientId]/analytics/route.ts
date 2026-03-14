import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'
import ReviewUsage from '@/models/ReviewUsage'
import Campaign from '@/models/Campaign'
import Lead from '@/models/Lead'

interface RouteParams {
  params: Promise<{ clientId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()

    const { clientId } = await params

    const [
      summaryCounts,
      byPlatformRaw,
      byLanguageRaw,
      usageOverTimeRaw,
      campaignsAggRaw,
      leadsAggRaw,
    ] = await Promise.all([
      (async () => {
        const [totalReviews, unusedReviews, usedReviews, archivedReviews, totalUsage] = await Promise.all([
          Review.countDocuments({ clientId }),
          Review.countDocuments({ clientId, status: 'UNUSED' }),
          Review.countDocuments({ clientId, status: 'USED' }),
          Review.countDocuments({ clientId, status: 'ARCHIVED' }),
          ReviewUsage.countDocuments({ clientId }),
        ])

        return { totalReviews, unusedReviews, usedReviews, archivedReviews, totalUsage }
      })(),
      ReviewUsage.aggregate([
        { $match: { clientId } },
        {
          $group: {
            _id: '$sourceName',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            platform: '$_id',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      Review.aggregate([
        { $match: { clientId } },
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            language: '$_id',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      ReviewUsage.aggregate([
        { $match: { clientId } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$usedAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1,
          },
        },
        { $sort: { date: 1 } },
      ]),
      Campaign.aggregate([
        { $match: { clientId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Lead.aggregate([
        { $match: { clientId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ])

    const byPlatform = byPlatformRaw as { platform: string; count: number }[]
    const byLanguage = byLanguageRaw as { language: string; count: number }[]
    const usageOverTime = usageOverTimeRaw as { date: string; count: number }[]
    const campaignsByStatus = (campaignsAggRaw as { _id: string; count: number }[]).map((c) => ({
      status: c._id,
      count: c.count,
    }))
    const leadsByStatus = (leadsAggRaw as { _id: string; count: number }[]).map((l) => ({
      status: l._id,
      count: l.count,
    }))

    const recommendations: {
      id: string
      severity: 'low' | 'medium' | 'high'
      title: string
      description: string
    }[] = []

    if (summaryCounts.unusedReviews > summaryCounts.usedReviews) {
      recommendations.push({
        id: 'many_unused_reviews',
        severity: 'medium',
        title: 'Many unused reviews',
        description:
          'There are more unused reviews than used ones. Consider planning campaigns to activate more of the existing content.',
      })
    }

    const platformsWithUsage = new Set(byPlatform.map((p) => p.platform))
    const keyPlatforms = ['Google', 'Facebook', 'Instagram', 'LinkedIn']
    keyPlatforms.forEach((platform) => {
      if (!platformsWithUsage.has(platform)) {
        recommendations.push({
          id: `no_usage_${platform.toLowerCase()}`,
          severity: 'low',
          title: `No ${platform} usage`,
          description: `There are no usage records on ${platform}. Consider using reviews on this platform to broaden reach.`,
        })
      }
    })

    return NextResponse.json({
      summary: summaryCounts,
      byPlatform,
      byLanguage,
      usageOverTime,
      campaignsByStatus,
      leadsByStatus,
      recommendations,
    })
  } catch (error) {
    console.error('Error fetching client analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client analytics' },
      { status: 500 }
    )
  }
}

