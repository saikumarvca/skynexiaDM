import { NextRequest, NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/auth";
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
  try {
    await requireUserFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId is required" },
      { status: 400 },
    );
  }

  try {
    await dbConnect();

    const client = await Client.findById(clientId).lean();
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

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
      Review.find({ clientId }).lean(),
      Campaign.find({ clientId }).lean(),
      Lead.find({ clientId }).lean(),
      Task.find({ clientId }).lean(),
      ContentItem.find({ clientId }).lean(),
      Keyword.find({ clientId }).lean(),
      ScheduledPost.find({ clientId }).lean(),
      Promise.resolve(ReviewRequest.find({ clientId }).lean()).catch(() => []),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      client,
      reviews,
      campaigns,
      leads,
      tasks,
      contentItems,
      keywords,
      scheduledPosts,
      reviewRequests,
    };

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="client-data-export.json"',
      },
    });
  } catch (error) {
    console.error("Error exporting client data:", error);
    return NextResponse.json(
      { error: "Failed to export client data" },
      { status: 500 },
    );
  }
}
