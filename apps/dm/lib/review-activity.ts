import dbConnect from '@/lib/mongodb';
import ReviewActivityLog from '@/models/ReviewActivityLog';
import type { EntityType } from '@/types/reviews';

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
    await ReviewActivityLog.create({
      entityType,
      entityId,
      action,
      oldValue,
      newValue,
      performedBy: performedBy || 'system',
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
