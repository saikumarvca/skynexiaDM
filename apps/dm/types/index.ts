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

export interface ClientFormData {
  name: string;
  businessName: string;
  brandName: string;
  contactName: string;
  phone: string;
  email: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
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
  | 'CANCELLED';

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

export interface Keyword {
  _id: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  keyword: string;
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

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
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