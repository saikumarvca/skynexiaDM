import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewDraft from '@/models/ReviewDraft';
import ReviewAllocation from '@/models/ReviewAllocation';
import PostedReview from '@/models/PostedReview';

export async function GET() {
  try {
    await dbConnect();

    const [drafts, allocations, posted] = await Promise.all([
      ReviewDraft.find({}),
      ReviewAllocation.find({}),
      PostedReview.find({}),
    ]);

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
    });
  } catch (error) {
    console.error('Error fetching review analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review analytics' },
      { status: 500 }
    );
  }
}
