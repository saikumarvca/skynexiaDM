import type {
  ClientEventActorRole,
  ClientEventCategory,
  ClientEventEntityType,
} from "@/models/ClientEvent";
import type { ClientUpdateCategory } from "@/models/ClientUpdate";

/**
 * Client-safe response shapes. Nothing in this file may carry internal notes,
 * team member identifiers, permissions, secrets or raw documents.
 */

/** Lifecycle stage of a review as the client sees it. */
export type ClientReviewStatus = "DRAFT" | "IN_PROGRESS" | "SHARED" | "POSTED";

export const CLIENT_REVIEW_STATUSES: ClientReviewStatus[] = [
  "POSTED",
  "SHARED",
  "IN_PROGRESS",
  "DRAFT",
];

export const CLIENT_REVIEW_STATUS_LABEL: Record<ClientReviewStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  SHARED: "Shared with You",
  POSTED: "Posted",
};

export type ClientReviewListItem = {
  id: string;
  /** "allocation" rows are customer-specific; "draft" rows are unassigned drafts. */
  kind: "allocation" | "draft";
  subject: string;
  customerName: string | null;
  platform: string | null;
  rating: number | null;
  status: ClientReviewStatus;
  createdAt: string;
  assignedDate: string | null;
  sharedDate: string | null;
  postedDate: string | null;
  reviewLink: string | null;
};

export type ClientReviewTimelineEvent = {
  id: string;
  step: "CREATED" | "ASSIGNED" | "SHARED" | "POSTED" | "ACTIVITY";
  title: string;
  description: string;
  actorName: string | null;
  actorRole: ClientEventActorRole | null;
  occurredAt: string;
};

export type ClientReviewDetail = ClientReviewListItem & {
  reviewText: string;
  category: string | null;
  language: string | null;
  proofUrl: string | null;
  postedByName: string | null;
  timeline: ClientReviewTimelineEvent[];
};

export type ClientKpi = {
  key: "total" | "posted" | "shared" | "inProgress" | "drafts";
  label: string;
  /** Current count (all time). */
  value: number;
  /** New in the selected period. */
  periodValue: number;
  /** New in the previous period of equal length. */
  previousPeriodValue: number;
  /** Percentage change vs previous period; null when previous is 0. */
  changePct: number | null;
};

export type ClientTrendPoint = {
  date: string;
  total: number;
  posted: number;
  shared: number;
  inProgress: number;
  drafts: number;
};

export type ClientStatusSlice = {
  status: ClientReviewStatus;
  label: string;
  count: number;
  pct: number;
};

export type ClientActivityItem = {
  id: string;
  entityType: ClientEventEntityType;
  action: string;
  title: string;
  description: string;
  actorName: string | null;
  actorRole: ClientEventActorRole;
  category: ClientEventCategory;
  relatedReviewId: string | null;
  relatedLabel: string | null;
  occurredAt: string;
};

export type ClientDashboardData = {
  range: {
    key: string;
    from: string;
    to: string;
    label: string;
    previousFrom: string;
    previousTo: string;
  };
  kpis: ClientKpi[];
  trend: ClientTrendPoint[];
  status: { total: number; slices: ClientStatusSlice[] };
  recentActivity: ClientActivityItem[];
  highlight: {
    postedThisPeriod: number;
    postedPreviousPeriod: number;
    changePct: number | null;
  };
};

export type ClientReviewAnalytics = {
  range: ClientDashboardData["range"];
  summary: {
    averageRating: number | null;
    positivePct: number | null;
    posted: number;
    shared: number;
    total: number;
    ratedCount: number;
  };
  byRating: { rating: number; count: number }[];
  byPlatform: { platform: string; posted: number; shared: number; inProgress: number; total: number }[];
  trend: ClientTrendPoint[];
  performance: {
    postedThisMonth: number;
    postedLastMonth: number;
    changePct: number | null;
    avgDaysSharedToPosted: number | null;
    sampleSize: number;
  };
};

export type ClientUpdateItem = {
  id: string;
  title: string;
  body: string;
  category: ClientUpdateCategory;
  postedByName: string;
  postedByRole: ClientEventActorRole;
  relatedReviewId: string | null;
  relatedLabel: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  publishedAt: string;
  isRead: boolean;
};

export type ClientNotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const PORTAL_ACTOR_ROLE_LABEL: Record<ClientEventActorRole, string> = {
  EMPLOYEE: "Employee",
  DEVELOPER: "Developer",
  AGENT: "Agent",
  ADMIN: "Admin",
  SYSTEM: "System",
};

export const PORTAL_CATEGORY_LABEL: Record<ClientEventCategory, string> = {
  REVIEW: "Review",
  DATA: "Data",
  FEATURE: "Feature",
  SYSTEM: "System",
};

export const PORTAL_UPDATE_CATEGORY_LABEL: Record<ClientUpdateCategory, string> = {
  ANNOUNCEMENT: "Announcement",
  PROGRESS: "Progress",
  FEATURE: "Feature",
  MAINTENANCE: "Maintenance",
  REPORTING: "Reporting",
};

export function clampPage(raw: string | null, fallback = 1): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

export function clampPageSize(raw: string | null, fallback = 20, max = 100): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): Paginated<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
