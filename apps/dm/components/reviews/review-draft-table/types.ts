import type { ReviewDraft, ReviewDraftFormData, AssignDraftFormData } from "@/types/reviews";
import type { Client } from "@/types";

export interface UserLite {
  _id: string;
  name: string;
}

export interface ReviewDraftTableProps {
  drafts: ReviewDraft[];
  clients: Client[];
  users: UserLite[];
  selectedClientId?: string;
  onCreate: (data: ReviewDraftFormData) => Promise<void>;
  onUpdate: (id: string, data: Partial<ReviewDraftFormData>) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onAssign: (id: string, data: AssignDraftFormData) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

