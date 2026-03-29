import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/require-session-api";
import dbConnect from "@/lib/mongodb";
import ReportSchedule from "@/models/ReportSchedule";
import ReportSendLog from "@/models/ReportSendLog";
import { sendEmail } from "@/lib/email";
import Campaign from "@/models/Campaign";
import Lead from "@/models/Lead";
import Keyword from "@/models/Keyword";

function esc(v: unknown): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mongoRefToIdString(ref: unknown): string {
  if (ref == null) return "";
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && "_id" in ref) {
    const id = (ref as { _id: unknown })._id;
    return id != null ? String(id) : "";
  }
  return String(ref);
}

type ScheduleEmailDoc = {
  sections: string[];
  clientId: { _id: string; businessName?: string; name?: string } | string;
  name: string;
};

async function buildReportHtml(schedule: ScheduleEmailDoc): Promise<string> {
  const clientId = mongoRefToIdString(schedule.clientId);
  const clientName =
    typeof schedule.clientId === "object"
      ? ((schedule.clientId as { businessName?: string; name?: string })
          .businessName ??
        (schedule.clientId as { name?: string }).name ??
        "Client")
      : "Client";

  const sections = schedule.sections ?? [];
  let body = "";

  if (sections.includes("campaigns")) {
    const campaigns = await Campaign.find({ clientId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const rows = campaigns
      .map(
        (c) =>
          `<tr><td>${esc(c.campaignName)}</td><td>${esc(c.platform)}</td><td>${esc(c.status)}</td><td>${esc((c.metrics as Record<string, unknown>)?.leads)}</td></tr>`,
      )
      .join("");
    body += `<h2>Campaigns</h2><table border="1" cellpadding="4" style="border-collapse:collapse;width:100%"><thead><tr><th>Name</th><th>Platform</th><th>Status</th><th>Leads</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No data</td></tr>'}</tbody></table>`;
  }

  if (sections.includes("leads")) {
    const leads = await Lead.find({ clientId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const rows = leads
      .map(
        (l) =>
          `<tr><td>${esc(l.name)}</td><td>${esc(l.source)}</td><td>${esc(l.status)}</td></tr>`,
      )
      .join("");
    body += `<h2>Leads</h2><table border="1" cellpadding="4" style="border-collapse:collapse;width:100%"><thead><tr><th>Name</th><th>Source</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No data</td></tr>'}</tbody></table>`;
  }

  if (sections.includes("seo")) {
    const keywords = await Keyword.find({ clientId, status: "ACTIVE" })
      .sort({ rank: 1 })
      .limit(20)
      .lean();
    const rows = keywords
      .map(
        (k) =>
          `<tr><td>${esc(k.keyword)}</td><td>${esc(k.rank ?? "—")}</td><td>${esc(k.searchVolume)}</td></tr>`,
      )
      .join("");
    body += `<h2>SEO Keywords</h2><table border="1" cellpadding="4" style="border-collapse:collapse;width:100%"><thead><tr><th>Keyword</th><th>Rank</th><th>Search Vol</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No data</td></tr>'}</tbody></table>`;
  }

  const exportDate = new Date().toLocaleDateString();
  return `<!DOCTYPE html><html><head><title>${esc(schedule.name)}</title><style>body{font-family:Arial,sans-serif;font-size:13px;margin:24px;color:#111}h1{font-size:20px}h2{font-size:16px;margin-top:24px}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#f3f4f6;padding:6px 8px;text-align:left}td{padding:5px 8px}tr:nth-child(even)td{background:#f9fafb}</style></head><body><h1>${esc(schedule.name)}</h1><p style="color:#666">Client: ${esc(clientName)} &middot; Generated: ${exportDate}</p>${body}</body></html>`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;
  try {
    await dbConnect();
    const { id } = await params;
    const schedule = await ReportSchedule.findById(id).populate(
      "clientId",
      "name businessName",
    );
    if (!schedule)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const html = await buildReportHtml(
      schedule.toObject() as unknown as ScheduleEmailDoc,
    );
    const emails = schedule.recipients.map((r: { email: string }) => r.email);

    const result = await sendEmail({
      to: emails,
      subject: `${schedule.name} — Report`,
      html,
    });

    await ReportSendLog.create({
      reportScheduleId: schedule._id,
      clientId: mongoRefToIdString(schedule.clientId),
      sentAt: new Date(),
      recipients: emails,
      status: result.success ? "SUCCESS" : "FAILED",
      errorMessage: result.error,
    });

    await ReportSchedule.findByIdAndUpdate(id, { lastSentAt: new Date() });

    return NextResponse.json({ ok: result.success, error: result.error });
  } catch (error) {
    console.error("Error sending report:", error);
    return NextResponse.json(
      { error: "Failed to send report" },
      { status: 500 },
    );
  }
}
