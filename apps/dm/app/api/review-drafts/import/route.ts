import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewDraft from '@/models/ReviewDraft';
import Client from '@/models/Client';
import { logActivity } from '@/lib/review-activity';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { drafts, clientId, createdBy = 'system' } = body;

    if (!Array.isArray(drafts) || drafts.length === 0) {
      return NextResponse.json(
        { error: 'drafts must be a non-empty array' },
        { status: 400 }
      );
    }

    const client = clientId
      ? await Client.findById(clientId)
      : await Client.findOne({ status: 'ACTIVE' });

    if (!client) {
      return NextResponse.json(
        { error: 'No client found. Provide clientId or ensure an active client exists.' },
        { status: 400 }
      );
    }

    const clientName = client.businessName ?? client.name;
    const created: string[] = [];

    for (const item of drafts) {
      if (!item.subject || !item.reviewText) continue;

      const draft = new ReviewDraft({
        subject: String(item.subject).trim(),
        reviewText: String(item.reviewText).trim(),
        clientId: client._id,
        clientName,
        category: String(item.category ?? 'Service').trim(),
        language: String(item.language ?? 'English').trim(),
        suggestedRating: String(item.suggestedRating ?? '5').trim(),
        tone: String(item.tone ?? 'Professional').trim(),
        reusable: item.reusable !== false,
        status: 'Available',
        createdBy,
        notes: item.notes ? String(item.notes).trim() : undefined,
      });
      await draft.save();

      await logActivity({
        entityType: 'DRAFT',
        entityId: draft._id.toString(),
        action: 'CREATE',
        newValue: draft.toObject(),
        performedBy: createdBy,
      });

      created.push(draft._id.toString());
    }

    return NextResponse.json({
      message: `Imported ${created.length} draft(s)`,
      count: created.length,
      draftIds: created,
    });
  } catch (error) {
    console.error('Error importing review drafts:', error);
    return NextResponse.json(
      { error: 'Failed to import' },
      { status: 500 }
    );
  }
}
