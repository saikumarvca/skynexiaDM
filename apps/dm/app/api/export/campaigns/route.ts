import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/require-session-api';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import { toCsv } from '@/lib/csv';

function fmt(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
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

    const headers = [
      'Campaign Name',
      'Client',
      'Platform',
      'Status',
      'Objective',
      'Budget',
      'Start Date',
      'End Date',
      'Impressions',
      'Clicks',
      'CTR',
      'Leads',
      'Conversions',
      'CPL',
      'Conversion Rate',
      'Notes',
      'Created At',
    ];

    const rows = campaigns.map((c) => {
      const client = c.clientId as { businessName?: string; name?: string } | null;
      const clientName = client?.businessName ?? client?.name ?? '';
      const m = (c.metrics as Record<string, unknown>) ?? {};
      return [
        fmt(c.campaignName),
        clientName,
        fmt(c.platform),
        fmt(c.status),
        fmt(c.objective),
        fmt(c.budget),
        fmt(c.startDate),
        fmt(c.endDate),
        fmt(m.impressions),
        fmt(m.clicks),
        fmt(m.ctr),
        fmt(m.leads),
        fmt(m.conversions),
        fmt(m.costPerLead),
        fmt(m.conversionRate),
        fmt(c.notes),
        fmt(c.createdAt),
      ];
    });

    const csv = toCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="campaigns.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting campaigns:', error);
    return NextResponse.json({ error: 'Failed to export campaigns' }, { status: 500 });
  }
}
