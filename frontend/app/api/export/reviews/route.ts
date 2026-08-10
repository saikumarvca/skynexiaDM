import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import { toCsv } from "@/lib/csv";

function fmt(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (status && status !== "ALL") query.status = status;

    const reviews = await Review.find(query)
      .populate("clientId", "name businessName")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Client",
      "Short Label",
      "Review Text",
      "Category",
      "Language",
      "Rating Style",
      "Status",
      "Created At",
    ];

    const rows = reviews.map((r) => {
      const client = r.clientId as {
        businessName?: string;
        name?: string;
      } | null;
      const clientName = client?.businessName ?? client?.name ?? "";
      return [
        clientName,
        fmt(r.shortLabel),
        fmt(r.reviewText),
        fmt(r.category),
        fmt(r.language),
        fmt(r.ratingStyle),
        fmt(r.status),
        fmt(r.createdAt),
      ];
    });

    const csv = toCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="reviews.csv"',
      },
    });
  } catch (error) {
    console.error("Error exporting reviews:", error);
    return NextResponse.json(
      { error: "Failed to export reviews" },
      { status: 500 },
    );
  }
}
