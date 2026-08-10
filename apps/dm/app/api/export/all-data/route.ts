import { NextRequest, NextResponse } from "next/server";
import { requireUserFromRequest, assertAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import Review from "@/models/Review";
import Campaign from "@/models/Campaign";
import Lead from "@/models/Lead";
import Task from "@/models/Task";
import ContentItem from "@/models/ContentItem";
import Keyword from "@/models/Keyword";
import ScheduledPost from "@/models/ScheduledPost";
import ReviewRequest from "@/models/ReviewRequest";

export async function GET(request: NextRequest) {
  let sessionUser;
  try {
    sessionUser = await requireUserFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertAdmin(sessionUser);
  } catch {
    return NextResponse.json(
      { error: "Forbidden: admin only" },
      { status: 403 },
    );
  }

  try {
    await dbConnect();

    const clients = await Client.find({}).lean();

    const clientIds = clients.map((c) => c._id);

    const [
      reviews,
      campaigns,
      leads,
      tasks,
      contentItems,
      keywords,
      scheduledPosts,
      reviewRequests,
    ] = await Promise.all([
      Review.find({ clientId: { $in: clientIds } }).lean(),
      Campaign.find({ clientId: { $in: clientIds } }).lean(),
      Lead.find({ clientId: { $in: clientIds } }).lean(),
      Task.find({ clientId: { $in: clientIds } }).lean(),
      ContentItem.find({ clientId: { $in: clientIds } }).lean(),
      Keyword.find({ clientId: { $in: clientIds } }).lean(),
      ScheduledPost.find({ clientId: { $in: clientIds } }).lean(),
      Promise.resolve(
        ReviewRequest.find({ clientId: { $in: clientIds } }).lean(),
      ).catch(() => []),
    ]);

    // Group data by client
    const groupById = <T extends { clientId: unknown }>(
      arr: T[],
      key: string,
    ) => {
      const map: Record<string, T[]> = {};
      for (const item of arr) {
        const id = String(
          (item as unknown as Record<string, unknown>)[key] ?? "",
        );
        if (!map[id]) map[id] = [];
        map[id].push(item);
      }
      return map;
    };

    const reviewsByClient = groupById(reviews, "clientId");
    const campaignsByClient = groupById(campaigns, "clientId");
    const leadsByClient = groupById(leads, "clientId");
    const tasksByClient = groupById(tasks, "clientId");
    const contentByClient = groupById(contentItems, "clientId");
    const keywordsByClient = groupById(keywords, "clientId");
    const postsByClient = groupById(scheduledPosts, "clientId");
    const requestsByClient = groupById(
      reviewRequests as unknown as Array<{ clientId: unknown }>,
      "clientId",
    );

    const clientsWithData = clients.map((client) => {
      const id = String(client._id);
      return {
        client,
        reviews: reviewsByClient[id] ?? [],
        campaigns: campaignsByClient[id] ?? [],
        leads: leadsByClient[id] ?? [],
        tasks: tasksByClient[id] ?? [],
        contentItems: contentByClient[id] ?? [],
        keywords: keywordsByClient[id] ?? [],
        scheduledPosts: postsByClient[id] ?? [],
        reviewRequests: requestsByClient[id] ?? [],
      };
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalClients: clients.length,
      clients: clientsWithData,
    };

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="all-data-export.json"',
      },
    });
  } catch (error) {
    console.error("Error exporting all data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
