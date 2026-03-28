import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/require-session-api';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

function esc(v: unknown): string {
  if (v == null) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(v: unknown): string {
  if (!v) return '';
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

export async function GET(request: NextRequest) {
  const denied = await requireSessionApi(request);
  if (denied) return denied;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;

    const campaigns = await Campaign.find(query)
      .populate('clientId', 'name businessName')
      .sort({ createdAt: -1 })
      .lean();

    const exportDate = new Date().toLocaleDateString();

    const rows = campaigns.map((c) => {
      const client = c.clientId as { businessName?: string; name?: string } | null;
      const clientName = client?.businessName ?? client?.name ?? '';
      const m = (c.metrics as Record<string, unknown>) ?? {};
      const startDate = fmtDate(c.startDate);
      const endDate = fmtDate(c.endDate);
      const dates = startDate && endDate ? `${startDate} – ${endDate}` : startDate || endDate || '';
      return `
      <tr>
        <td>${esc(c.campaignName)}</td>
        <td>${esc(clientName)}</td>
        <td>${esc(c.platform)}</td>
        <td>${esc(c.status)}</td>
        <td>${esc(c.budget)}</td>
        <td>${esc(dates)}</td>
        <td>${esc(m.leads)}</td>
        <td>${esc(m.conversions)}</td>
        <td>${esc(m.ctr)}</td>
        <td>${esc(m.costPerLead)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Campaigns Export</title>
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
  <h1>Campaigns Export</h1>
  <p class="meta">Exported: ${exportDate} &middot; ${campaigns.length} record${campaigns.length !== 1 ? 's' : ''}</p>
  <table>
    <thead>
      <tr>
        <th>Campaign Name</th>
        <th>Client</th>
        <th>Platform</th>
        <th>Status</th>
        <th>Budget</th>
        <th>Dates</th>
        <th>Leads</th>
        <th>Conversions</th>
        <th>CTR</th>
        <th>CPL</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="10">No records found.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating campaigns PDF:', error);
    return NextResponse.json({ error: 'Failed to generate campaigns PDF' }, { status: 500 });
  }
}
