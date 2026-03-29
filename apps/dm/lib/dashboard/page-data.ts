import { readFileSync } from "fs";
import { join } from "path";
import dbConnect from "@/lib/mongodb";
import type { DashboardPageData, DashboardTechnicalSnapshot } from "@/types";
import Client from "@/models/Client";
import Review from "@/models/Review";
import Lead from "@/models/Lead";
import Campaign from "@/models/Campaign";
import Task from "@/models/Task";
import ScheduledPost from "@/models/ScheduledPost";
import ReviewDraft from "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import ReviewRequest from "@/models/ReviewRequest";
import Webhook from "@/models/Webhook";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import Notification from "@/models/Notification";
import ContentItem from "@/models/ContentItem";
import Keyword from "@/models/Keyword";

function scheduledTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function readAppVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export async function getDashboardPageData(options: {
  isAdmin: boolean;
}): Promise<DashboardPageData> {
  await dbConnect();
  const { start, end } = scheduledTodayBounds();

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
    reviewDrafts,
    reviewAllocations,
    reviewRequestsPending,
    leadAgg,
  ] = await Promise.all([
    Client.countDocuments({ status: { $ne: "ARCHIVED" } }),
    Review.countDocuments({ status: { $ne: "ARCHIVED" } }),
    Review.countDocuments({ status: "UNUSED" }),
    Review.countDocuments({ status: "USED" }),
    Lead.countDocuments({}),
    Campaign.countDocuments({}),
    Campaign.countDocuments({ status: "ACTIVE" }),
    Task.countDocuments({
      status: { $in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
    }),
    ScheduledPost.countDocuments({
      publishDate: { $gte: start, $lte: end },
      status: "SCHEDULED",
    }),
    ReviewDraft.countDocuments({}),
    ReviewAllocation.countDocuments({}),
    ReviewRequest.countDocuments({ status: "PENDING" }),
    Lead.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const leadStatusBreakdown: Record<string, number> = {};
  for (const row of leadAgg) {
    if (row._id != null) leadStatusBreakdown[String(row._id)] = row.count;
  }

  let technical: DashboardTechnicalSnapshot | null = null;
  if (options.isAdmin) {
    const [
      cClient,
      cReview,
      cLead,
      cCampaign,
      cTask,
      cScheduledPost,
      cWebhook,
      cTeamMember,
      cUser,
      cNotification,
      cContentItem,
      cKeyword,
      cReviewDraft,
      cReviewAllocation,
      cReviewRequest,
      webhooksEnabled,
      webhooksDisabled,
      usersActive,
      usersInactive,
      teamActive,
      teamInactive,
      clientsArchived,
      reviewsArchived,
    ] = await Promise.all([
      Client.countDocuments({}),
      Review.countDocuments({}),
      Lead.countDocuments({}),
      Campaign.countDocuments({}),
      Task.countDocuments({}),
      ScheduledPost.countDocuments({}),
      Webhook.countDocuments({}),
      TeamMember.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({}),
      Notification.countDocuments({}),
      ContentItem.countDocuments({}),
      Keyword.countDocuments({}),
      ReviewDraft.countDocuments({}),
      ReviewAllocation.countDocuments({}),
      ReviewRequest.countDocuments({}),
      Webhook.countDocuments({ isActive: true }),
      Webhook.countDocuments({ isActive: false }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      TeamMember.countDocuments({ status: "Active", isDeleted: { $ne: true } }),
      TeamMember.countDocuments({
        status: "Inactive",
        isDeleted: { $ne: true },
      }),
      Client.countDocuments({ status: "ARCHIVED" }),
      Review.countDocuments({ status: "ARCHIVED" }),
    ]);
    const counts = {
      clients: cClient,
      reviews: cReview,
      leads: cLead,
      campaigns: cCampaign,
      tasks: cTask,
      scheduledPosts: cScheduledPost,
      webhooks: cWebhook,
      teamMembers: cTeamMember,
      users: cUser,
      notifications: cNotification,
      contentItems: cContentItem,
      keywords: cKeyword,
      reviewDrafts: cReviewDraft,
      reviewAllocations: cReviewAllocation,
      reviewRequests: cReviewRequest,
    };
    const totalDocuments = Object.values(counts).reduce((a, b) => a + b, 0);
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    technical = {
      appVersion: readAppVersion(),
      nodeEnv: process.env.NODE_ENV ?? "development",
      generatedAt: new Date().toISOString(),
      publicAppUrl: publicUrl && publicUrl.length > 0 ? publicUrl : null,
      counts,
      breakdown: {
        webhooksEnabled,
        webhooksDisabled,
        usersActive,
        usersInactive,
        teamActive,
        teamInactive,
        clientsArchived,
        reviewsArchived,
      },
      totalDocuments,
    };
  }

  return {
    totalClients,
    totalReviews,
    unusedReviews,
    usedReviews,
    totalLeads,
    totalCampaigns,
    activeCampaigns,
    openTasks,
    scheduledToday,
    reviewDrafts,
    reviewAllocations,
    reviewRequestsPending,
    leadStatusBreakdown,
    technical,
  };
}
