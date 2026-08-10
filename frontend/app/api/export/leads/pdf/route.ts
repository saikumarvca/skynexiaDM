import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";

function esc(v: unknown): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
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
    if (status) query.status = status;

    const leads = await Lead.find(query)
      .populate("clientId", "name businessName")
      .populate("campaignId", "campaignName")
      .sort({ createdAt: -1 })
      .lean();

    const exportDate = new Date().toLocaleDateString();

    const rows = leads
      .map((l) => {
        const client = l.clientId as {
          businessName?: string;
          name?: string;
        } | null;
        const clientName = client?.businessName ?? client?.name ?? "";
        const campaign = l.campaignId as { campaignName?: string } | null;
        const campaignName = campaign?.campaignName ?? "";
        return `
      <tr>
        <td>${esc(l.name)}</td>
        <td>${esc(l.email)}</td>
        <td>${esc(l.phone)}</td>
        <td>${esc(clientName)}</td>
        <td>${esc(l.source)}</td>
        <td>${esc(l.status)}</td>
        <td>${esc(campaignName)}</td>
        <td>${esc(fmtDate(l.createdAt))}</td>
      </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Leads Export</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p.meta { font-size: 11px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; border-bottom: 2px solid #e5e7eb; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .no-print { display: block; margin-bottom: 16px; }
    @media print {
      .no-print { display: none; }
      body { margin: 0; }
    }
    button { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
  </style>
  <script>
    if (window.location.search.includes('autoprint=1')) {
      window.addEventListener('load', function() { setTimeout(function(){ window.print(); }, 500); });
    }
  </script>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <h1>Leads Export</h1>
  <p class="meta">Exported: ${exportDate} &middot; ${leads.length} record${leads.length !== 1 ? "s" : ""}</p>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Client</th>
        <th>Source</th>
        <th>Status</th>
        <th>Campaign</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="8">No records found.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating leads PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate leads PDF" },
      { status: 500 },
    );
  }
}
