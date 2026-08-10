import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import Campaign from "@/models/Campaign";
import Lead from "@/models/Lead";
import Task from "@/models/Task";
import Review from "@/models/Review";
import ContentItem from "@/models/ContentItem";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";

    if (q.length < 2) {
      return NextResponse.json({
        clients: [],
        campaigns: [],
        leads: [],
        tasks: [],
        reviews: [],
        content: [],
      });
    }

    await dbConnect();

    const regex = { $regex: q, $options: "i" };

    const [clients, campaigns, leads, tasks, reviews, content] =
      await Promise.all([
        // Clients: search name, businessName, brandName, email
        Client.find({
          $or: [
            { name: regex },
            { businessName: regex },
            { brandName: regex },
            { email: regex },
          ],
        })
          .select("_id name businessName status")
          .limit(5)
          .lean(),

        // Campaigns: search campaignName
        Campaign.find({ campaignName: regex })
          .select("_id campaignName platform status clientId")
          .populate("clientId", "businessName")
          .limit(5)
          .lean(),

        // Leads: search name, email
        Lead.find({
          $or: [{ name: regex }, { email: regex }],
        })
          .select("_id name email status clientId")
          .populate("clientId", "businessName")
          .limit(5)
          .lean(),

        // Tasks: search title
        Task.find({ title: regex })
          .select("_id title status priority")
          .limit(5)
          .lean(),

        // Reviews: search shortLabel, reviewText
        Review.find({
          $or: [{ shortLabel: regex }, { reviewText: regex }],
        })
          .select("_id shortLabel status")
          .limit(3)
          .lean(),

        // ContentItems: search title, content
        ContentItem.find({
          $or: [{ title: regex }, { content: regex }],
        })
          .select("_id title category platform")
          .limit(3)
          .lean(),
      ]);

    return NextResponse.json({
      clients,
      campaigns,
      leads,
      tasks,
      reviews,
      content,
    });
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
