export type DraftStatus =
  | "Available"
  | "Allocated"
  | "Shared"
  | "Used"
  | "Archived";

export type AllocationStatus =
  | "Unassigned"
  | "Assigned"
  | "Shared with Customer"
  | "Posted"
  | "Used"
  | "Cancelled";

export type EntityType = "DRAFT" | "ALLOCATION" | "POSTED_REVIEW";

export interface ReviewDraft {
  _id: string;
  subject: string;
  reviewText: string;
  clientId: string | { _id: string; name?: string; businessName?: string };
  clientName: string;
  category: string;
  language: string;
  suggestedRating: string;
  tone: string;
  reusable: boolean;
  status: DraftStatus;
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewAllocation {
  _id: string;
  draftId:
    | string
    | {
        _id: string;
        subject?: string;
        reviewText?: string;
        clientName?: string;
        clientId?: string;
      };
  assignedToUserId: string;
  assignedToUserName: string;
  assignedByUserId: string;
  assignedByUserName: string;
  assignedDate: string;
  customerName?: string;
  customerContact?: string;
  platform?: string;
  sentDate?: string;
  allocationStatus: AllocationStatus;
  postedDate?: string;
  usedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostedReview {
  _id: string;
  allocationId: string | { _id: string };
  draftId: string | { _id: string; subject?: string; reviewText?: string };
  postedByName: string;
  customerContact?: string;
  platform: string;
  reviewLink?: string;
  proofUrl?: string;
  postedDate: string;
  markedUsedBy: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewActivityLog {
  _id: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  performedBy: string;
  performedAt: string;
}

export interface ReviewDraftFormData {
  subject: string;
  reviewText: string;
  clientId: string;
  clientName: string;
  category: string;
  language: string;
  suggestedRating: string;
  tone: string;
  reusable: boolean;
  notes?: string;
}

export interface AssignDraftFormData {
  draftId: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedByUserId: string;
  assignedByUserName: string;
  customerName?: string;
  customerContact?: string;
  platform?: string;
}

export interface MarkSharedFormData {
  customerName: string;
  customerContact?: string;
  platform?: string;
  sentDate: string;
}

export interface MarkPostedFormData {
  postedByName: string;
  customerContact?: string;
  platform: string;
  reviewLink: string;
  proofUrl?: string;
  postedDate: string;
  markedUsedBy: string;
  remarks?: string;
}
