import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import ItemMaster from "@/models/ItemMaster";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const item = await ItemMaster.findById(id).lean();
    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oid = new mongoose.Types.ObjectId(id);
    const facetResult = await Invoice.aggregate([
      { $unwind: "$lineItems" },
      { $match: { "lineItems.itemMasterId": oid } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                lineCount: { $sum: 1 },
                totalQuantity: { $sum: "$lineItems.quantity" },
                totalRevenue: { $sum: "$lineItems.total" },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: "$status",
                lineCount: { $sum: 1 },
                revenue: { $sum: "$lineItems.total" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          distinctInvoices: [{ $group: { _id: "$_id" } }, { $count: "count" }],
        },
      },
    ]);

    const row = facetResult[0] as {
      summary: {
        lineCount: number;
        totalQuantity: number;
        totalRevenue: number;
      }[];
      byStatus: { _id: string; lineCount: number; revenue: number }[];
      distinctInvoices: { count: number }[];
    } | undefined;
    if (!row) {
      return NextResponse.json({
        item: JSON.parse(JSON.stringify(item)),
        lineCount: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        invoiceCount: 0,
        byStatus: [],
      });
    }
    const summary = row.summary[0] ?? {
      lineCount: 0,
      totalQuantity: 0,
      totalRevenue: 0,
    };
    const invoiceCount = row.distinctInvoices[0]?.count ?? 0;

    return NextResponse.json({
      item: JSON.parse(JSON.stringify(item)),
      lineCount: summary.lineCount,
      totalQuantity: summary.totalQuantity,
      totalRevenue: summary.totalRevenue,
      invoiceCount,
      byStatus: row.byStatus.map((s) => ({
        status: s._id,
        lineCount: s.lineCount,
        revenue: s.revenue,
      })),
    });
  } catch (error) {
    console.error("Error aggregating item analytics:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
