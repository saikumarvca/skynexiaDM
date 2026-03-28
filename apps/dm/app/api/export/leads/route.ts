import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/require-session-api';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
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

    const leads = await Lead.find(query)
      .populate('clientId', 'name businessName')
      .populate('campaignId', 'campaignName')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Client',
      'Source',
      'Campaign',
      'Status',
      'Notes',
      'Created At',
    ];

    const rows = leads.map((l) => {
      const client = l.clientId as { businessName?: string; name?: string } | null;
      const clientName = client?.businessName ?? client?.name ?? '';
      const campaign = l.campaignId as { campaignName?: string } | null;
      const campaignName = campaign?.campaignName ?? '';
      return [
        fmt(l.name),
        fmt(l.email),
        fmt(l.phone),
        clientName,
        fmt(l.source),
        campaignName,
        fmt(l.status),
        fmt(l.notes),
        fmt(l.createdAt),
      ];
    });

    const csv = toCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="leads.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting leads:', error);
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 });
  }
}
