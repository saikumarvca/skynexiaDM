import TeamActivityLog from '@/models/TeamActivityLog';

export interface LogActivityParams {
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  targetName?: string;
  details?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const log = new TeamActivityLog(params);
  await log.save();
}

export interface ActivityQueryParams {
  userId?: string;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function buildActivityQuery(params: ActivityQueryParams) {
  const query: Record<string, unknown> = {};
  if (params.userId) query.userId = params.userId;
  if (params.module) query.module = params.module;
  if (params.dateFrom || params.dateTo) {
    query.createdAt = {};
    if (params.dateFrom) {
      (query.createdAt as Record<string, Date>).$gte = new Date(params.dateFrom);
    }
    if (params.dateTo) {
      const d = new Date(params.dateTo);
      d.setHours(23, 59, 59, 999);
      (query.createdAt as Record<string, Date>).$lte = d;
    }
  }
  return query;
}
