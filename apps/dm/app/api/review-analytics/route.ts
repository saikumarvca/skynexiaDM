import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewDraft from '@/models/ReviewDraft';
import ReviewAllocation from '@/models/ReviewAllocation';
import PostedReview from '@/models/PostedReview';
import ReviewUsage from '@/models/ReviewUsage';

export async function GET() {
  try {
    await dbConnect();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [drafts, allocations, posted, monthlyUsageRaw, monthlyDraftsRaw, platformBreakdownRaw, topReviewersRaw, totalReviewsAvailable] =
      await Promise.all([
        ReviewDraft.find({}),
        ReviewAllocation.find({}),
        PostedReview.find({}),
        // Monthly usage (ReviewUsage model)
        ReviewUsage.aggregate([
          { $match: { usedAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$usedAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // Monthly drafts created (ReviewDraft model)
        ReviewDraft.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // Platform breakdown from ReviewUsage.sourceName
        ReviewUsage.aggregate([
          {
            $group: {
              _id: '$sourceName',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
        // Top 5 reviewers by usedBy
        ReviewUsage.aggregate([
          {
            $group: {
              _id: '$usedBy',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        // Total reviews available for response rate
        ReviewUsage.countDocuments({}),
      ]);

    // ── Existing stats ────────────────────────────────────────────────────────

    const totalDrafts = drafts.length;
    const available = drafts.filter((d) => d.status === 'Available').length;
    const allocated = drafts.filter((d) => d.status === 'Allocated').length;
    const shared = drafts.filter((d) => d.status === 'Shared').length;
    const used = drafts.filter((d) => d.status === 'Used').length;

    const teamUsage: Record<string, number> = {};
    for (const a of allocations) {
      if (a.allocationStatus === 'Used' || a.allocationStatus === 'Posted') {
        teamUsage[a.assignedToUserName] = (teamUsage[a.assignedToUserName] ?? 0) + 1;
      }
    }

    const platformUsage: Record<string, number> = {};
    for (const p of posted) {
      platformUsage[p.platform] = (platformUsage[p.platform] ?? 0) + 1;
    }

    const dailyTrend: Record<string, number> = {};
    for (const p of posted) {
      const d = new Date(p.postedDate).toISOString().slice(0, 10);
      dailyTrend[d] = (dailyTrend[d] ?? 0) + 1;
    }

    const statusDistribution = {
      Available: available,
      Allocated: allocated,
      Shared: shared,
      Used: used,
      Archived: drafts.filter((d) => d.status === 'Archived').length,
    };

    // ── New analytics ─────────────────────────────────────────────────────────

    // Build a month-keyed lookup for both used and drafted over the last 6 months
    const usedByMonth: Record<string, number> = {};
    for (const r of monthlyUsageRaw as { _id: string; count: number }[]) {
      usedByMonth[r._id] = r.count;
    }

    const draftedByMonth: Record<string, number> = {};
    for (const r of monthlyDraftsRaw as { _id: string; count: number }[]) {
      draftedByMonth[r._id] = r.count;
    }

    // Generate the last-6-month keys in order
    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const monthlyTrends = monthKeys.map((month) => ({
      month,
      used: usedByMonth[month] ?? 0,
      drafted: draftedByMonth[month] ?? 0,
    }));

    const platformBreakdown = (platformBreakdownRaw as { _id: string; count: number }[]).map(
      (p) => ({ platform: p._id ?? 'Unknown', count: p.count })
    );

    const topReviewers = (topReviewersRaw as { _id: string; count: number }[]).map((r) => ({
      name: r._id ?? 'Unknown',
      count: r.count,
    }));

    // Response rate: used reviews / total reviews in ReviewDraft
    const responseRate =
      totalDrafts > 0 ? Math.round((used / totalDrafts) * 100) : 0;

    return NextResponse.json({
      totalDrafts,
      available,
      allocated,
      shared,
      used,
      teamUsage: Object.entries(teamUsage).map(([name, count]) => ({ name, count })),
      platformUsage: Object.entries(platformUsage).map(([platform, count]) => ({ platform, count })),
      statusDistribution,
      dailyTrend: Object.entries(dailyTrend)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 14)
        .map(([date, count]) => ({ date, count })),
      // New fields
      monthlyTrends,
      platformBreakdown,
      topReviewers,
      responseRate,
    });
  } catch (error) {
    console.error('Error fetching review analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review analytics' },
      { status: 500 }
    );
  }
}
