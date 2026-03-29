import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReviewDraft from "@/models/ReviewDraft";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireSessionApi(request);
    if (denied) return denied;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const query: Record<string, unknown> = {};
    if (status && status !== "ALL") query.status = status;
    if (clientId) query.clientId = clientId;

    const drafts = await ReviewDraft.find(query)
      .populate("clientId", "name businessName")
      .sort({ createdAt: -1 });

    const escapeCsv = (v: unknown): string => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = [
      "Subject",
      "Review Text",
      "Client",
      "Category",
      "Language",
      "Suggested Rating",
      "Tone",
      "Reusable",
      "Status",
      "Created By",
      "Created At",
    ];
    const rows = drafts.map((d) => {
      const client = d.clientId as {
        name?: string;
        businessName?: string;
      } | null;
      const clientName =
        client?.businessName ?? client?.name ?? d.clientName ?? "";
      return [
        escapeCsv(d.subject),
        escapeCsv(d.reviewText),
        escapeCsv(clientName),
        escapeCsv(d.category),
        escapeCsv(d.language),
        escapeCsv(d.suggestedRating),
        escapeCsv(d.tone),
        escapeCsv(d.reusable ? "Yes" : "No"),
        escapeCsv(d.status),
        escapeCsv(d.createdBy),
        escapeCsv(d.createdAt),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="review-drafts.csv"',
      },
    });
  } catch (error) {
    console.error("Error exporting review drafts:", error);
    return NextResponse.json(
      { error: "Failed to export review drafts" },
      { status: 500 },
    );
  }
}
