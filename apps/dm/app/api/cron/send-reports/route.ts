import { NextRequest, NextResponse } from "next/server";
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

function computeNextSendAt(
  frequency: string,
  dayOfMonth?: number,
  dayOfWeek?: number,
): Date {
  const now = new Date();
  const next = new Date(now);
  if (frequency === "WEEKLY") {
    const target = (dayOfWeek ?? 1) % 7;
    next.setDate(next.getDate() + 7);
  } else if (frequency === "MONTHLY") {
    next.setMonth(next.getMonth() + 1, dayOfMonth ?? 1);
  } else if (frequency === "QUARTERLY") {
    next.setMonth(next.getMonth() + 3, dayOfMonth ?? 1);
  }
  next.setHours(8, 0, 0, 0);
  return next;
}

type ScheduleDoc = {
  _id: string;
  name: string;
  sections: string[];
  clientId: { _id: string; businessName?: string; name?: string } | string;
  frequency: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  recipients: { email: string }[];
};

async function buildReportHtml(schedule: ScheduleDoc): Promise<string> {
  const clientId =
    typeof schedule.clientId === "string"
      ? schedule.clientId
      : String((schedule.clientId as { _id: string })._id);
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

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const now = new Date();
    const due = await ReportSchedule.find({
      isActive: true,
      nextSendAt: { $lte: now },
    })
      .populate("clientId", "name businessName")
      .limit(20);

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const schedule of due) {
      try {
        const html = await buildReportHtml(schedule.toObject() as ScheduleDoc);
        const emails = schedule.recipients.map(
          (r: { email: string }) => r.email,
        );
        const result = await sendEmail({
          to: emails,
          subject: `${schedule.name} — Report`,
          html,
        });

        await ReportSendLog.create({
          reportScheduleId: schedule._id,
          clientId:
            typeof schedule.clientId === "object"
              ? (schedule.clientId as { _id: string })._id
              : schedule.clientId,
          sentAt: new Date(),
          recipients: emails,
          status: result.success ? "SUCCESS" : "FAILED",
          errorMessage: result.error,
        });

        const nextSendAt = computeNextSendAt(
          schedule.frequency,
          schedule.dayOfMonth,
          schedule.dayOfWeek,
        );
        await ReportSchedule.findByIdAndUpdate(schedule._id, {
          lastSentAt: new Date(),
          nextSendAt,
        });
        results.push({
          id: String(schedule._id),
          ok: result.success,
          error: result.error,
        });
      } catch (err) {
        results.push({
          id: String(schedule._id),
          ok: false,
          error: String(err),
        });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("Cron send-reports error:", error);
    return NextResponse.json({ error: "Cron run failed" }, { status: 500 });
  }
}
