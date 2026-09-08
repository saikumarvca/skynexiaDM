import dbConnect from "@/lib/mongodb";
import ReviewActivityLog from "@/models/ReviewActivityLog";
import { recordClientEventsFromReviewActivity } from "@/lib/client-portal/events";
import type { EntityType } from "@/types/reviews";

export interface LogActivityParams {
  entityType: EntityType;
  entityId: string;
  action: string;
  oldValue?: Record<string, unknown> | object;
  newValue?: Record<string, unknown> | object;
  performedBy: string;
}

export async function logActivity({
  entityType,
  entityId,
  action,
  oldValue,
  newValue,
  performedBy,
}: LogActivityParams): Promise<void> {
  try {
    await dbConnect();
    const created = await ReviewActivityLog.create({
      entityType,
      entityId,
      action,
      oldValue,
      newValue,
      performedBy: performedBy || "system",
    });

    // Mirror the activity into the client-visible feed (with its own
    // visibility decision). Never blocks or fails the main flow.
    await recordClientEventsFromReviewActivity({
      _id: created._id,
      entityType,
      entityId,
      action,
      oldValue: (oldValue ?? null) as Record<string, unknown> | null,
      newValue: (newValue ?? null) as Record<string, unknown> | null,
      performedBy: performedBy || "system",
      performedAt: created.performedAt,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
