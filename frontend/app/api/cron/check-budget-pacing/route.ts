import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import CampaignSpendEntry from "@/models/CampaignSpendEntry";
import BudgetAlert from "@/models/BudgetAlert";

const THRESHOLDS = [0.75, 0.9, 1.0];

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const activeCampaigns = await Campaign.find({
      status: "ACTIVE",
      budget: { $gt: 0 },
    }).lean();
    const created: string[] = [];

    for (const campaign of activeCampaigns) {
      const budget = campaign.budget ?? 0;
      if (!budget) continue;

      const agg = await CampaignSpendEntry.aggregate([
        { $match: { campaignId: campaign._id } },
        { $group: { _id: null, total: { $sum: "$spend" } } },
      ]);
      const spend = agg[0]?.total ?? 0;
      const ratio = spend / budget;

      for (const threshold of THRESHOLDS) {
        if (ratio >= threshold) {
          const alreadyExists = await BudgetAlert.findOne({
            campaignId: campaign._id,
            threshold,
          });
          if (!alreadyExists) {
            await BudgetAlert.create({
              campaignId: campaign._id,
              clientId: campaign.clientId,
              threshold,
              spendToDate: spend,
              budget,
              triggeredAt: new Date(),
            });
            created.push(`${campaign._id}@${Math.round(threshold * 100)}%`);
          }
        }
      }
    }

    return NextResponse.json({
      checked: activeCampaigns.length,
      alertsCreated: created.length,
      created,
    });
  } catch (error) {
    console.error("Cron check-budget-pacing error:", error);
    return NextResponse.json({ error: "Cron run failed" }, { status: 500 });
  }
}
