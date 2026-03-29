export interface Client {
  _id: string;
  name: string;
  businessName: string;
  brandName: string;
  contactName: string;
  phone: string;
  email: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  website?: string;
  industry?: string;
  location?: string;
  marketingChannels?: string[];
  contractStart?: string;
  contractEnd?: string;
  monthlyBudget?: number;
  assignedManagerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  shortLabel: string;
  reviewText: string;
  category: string;
  language: string;
  ratingStyle: string;
  status: 'UNUSED' | 'USED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewUsage {
  _id: string;
  clientId: string;
  reviewId: string;
  sourceName: string;
  usedBy: string;
  profileName: string;
  usedAt: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  totalReviews: number;
  unusedReviews: number;
  usedReviews: number;
}

/** Aggregated metrics for `/dashboard` multi-variant shell (server-fetched once). */
export interface DashboardPageData {
  totalClients: number;
  totalReviews: number;
  unusedReviews: number;
  usedReviews: number;
  totalLeads: number;
  totalCampaigns: number;
  activeCampaigns: number;
  openTasks: number;
  scheduledToday: number;
  reviewDrafts: number;
  reviewAllocations: number;
  reviewRequestsPending: number;
  /** Counts per Lead.status for Growth funnel. */
  leadStatusBreakdown: Record<string, number>;
  /** Present only when loaded with isAdmin; otherwise null. */
  technical: DashboardTechnicalSnapshot | null;
}

export interface DashboardTechnicalCounts {
  clients: number;
  reviews: number;
  leads: number;
  campaigns: number;
  tasks: number;
  scheduledPosts: number;
  webhooks: number;
  teamMembers: number;
  users: number;
  notifications: number;
  contentItems: number;
  keywords: number;
  reviewDrafts: number;
  reviewAllocations: number;
  reviewRequests: number;
}

export interface DashboardTechnicalSnapshot {
  appVersion: string;
  nodeEnv: string;
  counts: DashboardTechnicalCounts;
}

export interface ClientFormData {
  name: string;
  businessName: string;
  brandName: string;
  contactName: string;
  phone: string;
  email: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  website?: string;
  industry?: string;
  location?: string;
  marketingChannels?: string[];
  /** ISO yyyy-mm-dd; null clears stored date */
  contractStart?: string | null;
  contractEnd?: string | null;
  monthlyBudget?: number | null;
  assignedManagerId?: string | null;
}

export interface ReviewFormData {
  clientId: string;
  shortLabel: string;
  reviewText: string;
  category: string;
  language: string;
  ratingStyle: string;
}

export interface BulkReviewFormData {
  clientId: string;
  reviews: string;
  category: string;
  language: string;
  ratingStyle: string;
}

export interface MarkUsedFormData {
  reviewId: string;
  sourceName: string;
  usedBy: string;
  profileName: string;
  usedAt: string;
  notes?: string;
}

export type CampaignStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface CampaignMetrics {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  leads?: number;
  conversions?: number;
  costPerLead?: number;
  conversionRate?: number;
}

export interface Campaign {
  _id: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  campaignName: string;
  platform: string;
  objective?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  status: CampaignStatus;
  metrics?: CampaignMetrics;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentCategory =
  | 'CAPTION'
  | 'HASHTAGS'
  | 'AD_COPY'
  | 'CTA'
  | 'HOOK'
  | 'OTHER';

export type ContentItemStatus = 'DRAFT' | 'APPROVED' | 'ARCHIVED';
export type ContentItemSource = 'MANUAL' | 'AI' | 'IMPORT';

export interface ContentItem {
  _id: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  title: string;
  content: string;
  platform?: string;
  category: ContentCategory;
  tags?: string[];
  status: ContentItemStatus;
  source: ContentItemSource;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewTemplate {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  tone?: string;
  platform?: string;
  suggestedCategory?: string;
  suggestedLanguage?: string;
  suggestedRatingStyle?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ScheduledPostStatus =
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED';

export interface ScheduledPost {
  _id: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  contentId?: string | { _id: string } | null;
  content: string;
  platform: string;
  publishDate: string;
  timeZone?: string;
  status: ScheduledPostStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Keyword {
  _id: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  keyword: string;
  status: 'ACTIVE' | 'ARCHIVED';
  searchVolume?: number;
  difficulty?: number;
  rank?: number;
  targetUrl?: string;
  competitorUrls?: string[];
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export interface Lead {
  _id: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  campaignId?: string | { _id: string; campaignName?: string } | null;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  _id: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  title: string;
  description?: string;
  assignedTo?: string | { _id: string; name?: string; email?: string } | null;
  priority: TaskPriority;
  deadline?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}