import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import Review from '@/models/Review'
import Lead from '@/models/Lead'
import Campaign from '@/models/Campaign'
import Task from '@/models/Task'
import ScheduledPost from '@/models/ScheduledPost'

export async function GET() {
  try {
    await dbConnect()

    const [
      totalClients,
      totalReviews,
      unusedReviews,
      usedReviews,
      totalLeads,
      totalCampaigns,
      activeCampaigns,
      openTasks,
      scheduledToday,
    ] = await Promise.all([
      Client.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      Review.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      Review.countDocuments({ status: 'UNUSED' }),
      Review.countDocuments({ status: 'USED' }),
      Lead.countDocuments({}),
      Campaign.countDocuments({}),
      Campaign.countDocuments({ status: 'ACTIVE' }),
      Task.countDocuments({ status: { $in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] } }),
      (async () => {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date()
        end.setHours(23, 59, 59, 999)
        return ScheduledPost.countDocuments({
          publishDate: { $gte: start, $lte: end },
          status: 'SCHEDULED',
        })
      })(),
    ])

    return NextResponse.json({
      totalClients,
      totalReviews,
      unusedReviews,
      usedReviews,
      totalLeads,
      totalCampaigns,
      activeCampaigns,
      openTasks,
      scheduledToday,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}