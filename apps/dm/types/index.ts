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
  clientId: string;
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