import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ReviewAllocation from '@/models/ReviewAllocation';
import ReviewDraft from '@/models/ReviewDraft';
import { logActivity } from '@/lib/review-activity';
import { parseWithSchema, apiError } from '@/lib/api/validation';
import { markSharedSchema } from '@/lib/api/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    const parsed = await parseWithSchema(request, markSharedSchema);
    if (!parsed.ok) return parsed.response;
    const { customerName, customerContact, platform, sentDate, performedBy = 'system' } = parsed.data;

    const existing = await ReviewAllocation.findById(id);
    if (!existing) {
      return apiError(404, 'Allocation not found', 'NOT_FOUND');
    }

    const update: Record<string, unknown> = {
      customerName: customerName.trim(),
      allocationStatus: 'Shared with Customer',
      updatedAt: new Date(),
    };
    if (customerContact) update.customerContact = customerContact;
    if (platform) update.platform = platform;
    if (sentDate) update.sentDate = new Date(sentDate);

    const allocation = await ReviewAllocation.findOneAndUpdate(
      { _id: id },
      update,
      { new: true }
    ).populate('draftId', 'subject reviewText clientName');

    await ReviewDraft.findByIdAndUpdate(existing.draftId, {
      status: 'Shared',
      updatedAt: new Date(),
    });

    await logActivity({
      entityType: 'ALLOCATION',
      entityId: id,
      action: 'MARK_SHARED',
      oldValue: existing.toObject(),
      newValue: allocation?.toObject(),
      performedBy,
    });

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error marking allocation as shared:', error);
    const msg = error instanceof Error ? error.message : 'Failed to mark as shared';
    return apiError(500, msg, 'INTERNAL_ERROR');
  }
}
