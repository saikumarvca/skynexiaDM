// Centralized enums and constants - do not scatter string literals across the module

export type TeamMemberStatus = "Active" | "Inactive";

export type AssignmentStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type AssignmentPriority = "Low" | "Medium" | "High" | "Urgent";

export type AssignmentType =
  | "review"
  | "lead"
  | "task"
  | "campaign"
  | "client"
  | "other";

export type SourceModule =
  | "reviews"
  | "leads"
  | "tasks"
  | "campaigns"
  | "clients";

export type WorkloadStatus = "Available" | "Balanced" | "Busy" | "Overloaded";

export const PERMISSION_LIST = [
  // View-only / execution permissions (use these for "workers")
  "view_dashboard",
  "view_clients",
  "view_campaigns",
  "view_content",
  "view_seo",
  "view_leads",
  "view_tasks",
  "work_assigned_tasks",
  "view_reviews",
  "work_assigned_reviews",

  // Management permissions (use these for leads/managers/admins)
  "manage_clients",
  "manage_campaigns",
  "manage_content",
  "manage_seo",
  "manage_leads",
  "manage_tasks",
  "manage_reviews",
  "manage_team",
  "manage_roles",
  "view_analytics",
  "assign_reviews",
  "assign_tasks",
  "manage_settings",
] as const;

export type Permission = (typeof PERMISSION_LIST)[number];

// Interfaces
export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  roleId?: string;
  roleName?: string;
  department?: string;
  avatarUrl?: string;
  userId?: string;
  assignedClientIds?: string[];
  assignedClientNamesSnapshot?: string[];
  status: TeamMemberStatus;
  notes?: string;
  joinedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamRole {
  _id: string;
  roleName: string;
  description?: string;
  permissions: string[];
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamAssignment {
  _id: string;
  title: string;
  description?: string;
  assignmentType: AssignmentType;
  sourceModule?: SourceModule;
  referenceId?: string;
  assignedToUserId: string;
  assignedPartnerAgencyId?: string;
  assignedToUserName: string;
  assignedByUserId: string;
  assignedByUserName: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamActivityLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  targetName?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// Form types
export interface TeamMemberFormData {
  name: string;
  email: string;
  phone?: string;
  roleId?: string;
  department?: string;
  notes?: string;
}

export interface TeamRoleFormData {
  roleName: string;
  description?: string;
  permissions: string[];
}

export interface TeamAssignmentFormData {
  title: string;
  description?: string;
  assignmentType: AssignmentType;
  sourceModule?: SourceModule;
  referenceId?: string;
  assignedToUserId: string;
  assignedPartnerAgencyId?: string;
  assignedByUserId: string;
  status?: AssignmentStatus;
  priority: AssignmentPriority;
  dueDate?: string;
  notes?: string;
}

// Pagination response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
