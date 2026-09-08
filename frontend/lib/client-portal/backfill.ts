import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ReviewActivityLog from "@/models/ReviewActivityLog";
import ReviewDraft from "@/models/ReviewDraft";
import ReviewAllocation from "@/models/ReviewAllocation";
import PostedReview from "@/models/PostedReview";
import ClientEvent from "@/models/ClientEvent";
import {
  recordClientEventsFromReviewActivity,
  type ReviewActivityLike,
} from "@/lib/client-portal/events";

export type BackfillResult = {
  scanned: number;
  alreadyMapped: number;
  created: number;
};

const BATCH = 200;

/**
 * Map historical ReviewActivityLog rows into ClientEvent rows. Idempotent:
 * rows whose id already appears as `sourceLogId` are skipped, and the unique
 * index guards against races. Optionally limited to one client.
 */
export async function backfillClientEvents(params?: {
  clientId?: string | null;
}): Promise<BackfillResult> {
  await dbConnect();
  const result: BackfillResult = { scanned: 0, alreadyMapped: 0, created: 0 };

  const filter: Record<string, unknown> = {};
  const clientId = params?.clientId;
  if (clientId) {
    if (!mongoose.isValidObjectId(clientId)) return result;
    const cid = new mongoose.Types.ObjectId(clientId);
    const draftIds = await ReviewDraft.find({ clientId: cid }).distinct("_id");
    const allocationIds = await ReviewAllocation.find({
      draftId: { $in: draftIds },
    }).distinct("_id");
    const postedIds = await PostedReview.find({
      draftId: { $in: draftIds },
    }).distinct("_id");
    filter.$or = [
      { entityType: "DRAFT", entityId: { $in: draftIds } },
      { entityType: "ALLOCATION", entityId: { $in: allocationIds } },
      { entityType: "POSTED_REVIEW", entityId: { $in: postedIds } },
      // Drafts that were moved away from this client.
      { entityType: "DRAFT", action: "REASSIGN_CLIENT", "oldValue.clientId": clientId },
    ];
  }

  const mappedIds = new Set(
    (
      await ClientEvent.find({ sourceLogId: { $type: "objectId" } })
        .distinct("sourceLogId")
    ).map((id) => String(id)),
  );

  let lastId: mongoose.Types.ObjectId | null = null;
  for (;;) {
    const page = await ReviewActivityLog.find(
      lastId ? { ...filter, _id: { $gt: lastId } } : filter,
    )
      .sort({ _id: 1 })
      .limit(BATCH)
      .lean();
    if (page.length === 0) break;

    for (const log of page) {
      result.scanned += 1;
      if (mappedIds.has(String(log._id))) {
        result.alreadyMapped += 1;
        continue;
      }
      result.created += await recordClientEventsFromReviewActivity(
        log as unknown as ReviewActivityLike,
      );
    }
    lastId = page[page.length - 1]!._id as mongoose.Types.ObjectId;
    if (page.length < BATCH) break;
  }
  return result;
}
