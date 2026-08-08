import { PERMISSION_LIST, Permission } from "@/types/team";

export { PERMISSION_LIST };

export type PermissionCategory =
  | "Team & Access"
  | "Clients"
  | "Campaigns"
  | "Content & SEO"
  | "Leads"
  | "Tasks"
  | "Reviews"
  | "Analytics"
  | "Settings";

export type PermissionDefinition = {
  key: string;
  label: string;
  description?: string;
  category: PermissionCategory;
};

const PERMISSION_DEFINITIONS_BASE: PermissionDefinition[] = [
  {
    key: "view_dashboard",
    label: "View dashboard",
    description: "Access the dashboard home and dashboard route group.",
    category: "Analytics",
  },
  {
    key: "view_clients",
    label: "View clients",
    description: "See client records (read-only).",
    category: "Clients",
  },
  {
    key: "view_campaigns",
    label: "View campaigns",
    description: "See campaigns (read-only).",
    category: "Campaigns",
  },
  {
    key: "view_content",
    label: "View content",
    description: "See content and calendars (read-only).",
    category: "Content & SEO",
  },
  {
    key: "view_seo",
    label: "View SEO",
    description: "See SEO dashboards and items (read-only).",
    category: "Content & SEO",
  },
  {
    key: "view_leads",
    label: "View leads",
    description: "See leads and pipeline (read-only).",
    category: "Leads",
  },
  {
    key: "view_tasks",
    label: "View tasks",
    description: "See tasks you have access to (read-only).",
    category: "Tasks",
  },
  {
    key: "work_assigned_tasks",
    label: "Work assigned tasks",
    description: "Update status/notes for tasks assigned to you.",
    category: "Tasks",
  },
  {
    key: "view_reviews",
    label: "View reviews",
    description: "See reviews you have access to (read-only).",
    category: "Reviews",
  },
  {
    key: "work_assigned_reviews",
    label: "Work assigned reviews",
    description: "Complete review work assigned to you without managing the review system.",
    category: "Reviews",
  },
  {
    key: "manage_team",
    label: "Manage team members",
    description: "Add, edit, activate/deactivate, and assign team members.",
    category: "Team & Access",
  },
  {
    key: "manage_roles",
    label: "Manage roles",
    description: "Create and edit roles and permissions.",
    category: "Team & Access",
  },
  {
    key: "manage_clients",
    label: "Manage clients",
    description: "Create, update, and archive client records.",
    category: "Clients",
  },
  {
    key: "manage_campaigns",
    label: "Manage campaigns",
    description: "Create, update, and schedule marketing campaigns.",
    category: "Campaigns",
  },
  {
    key: "manage_content",
    label: "Manage content",
    description: "Create and edit content items and calendars.",
    category: "Content & SEO",
  },
  {
    key: "manage_seo",
    label: "Manage SEO",
    description: "Update SEO tasks, audits, and related settings.",
    category: "Content & SEO",
  },
  {
    key: "manage_leads",
    label: "Manage leads",
    description: "View and update leads and pipeline stages.",
    category: "Leads",
  },
  {
    key: "manage_tasks",
    label: "Manage tasks",
    description: "Create, edit, and complete tasks.",
    category: "Tasks",
  },
  {
    key: "assign_tasks",
    label: "Assign tasks",
    description: "Assign tasks to team members.",
    category: "Tasks",
  },
  {
    key: "manage_reviews",
    label: "Manage reviews",
    description: "View and respond to reviews and review workflows.",
    category: "Reviews",
  },
  {
    key: "assign_reviews",
    label: "Assign reviews",
    description: "Assign review items to team members.",
    category: "Reviews",
  },
  {
    key: "view_analytics",
    label: "View analytics",
    description: "Access reporting and analytics dashboards.",
    category: "Analytics",
  },
  {
    key: "manage_settings",
    label: "Manage settings",
    description: "Update workspace and application settings.",
    category: "Settings",
  },
];

const PERMISSION_DEFINITIONS_BY_KEY = new Map(
  PERMISSION_DEFINITIONS_BASE.map((d) => [d.key, d]),
);

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = PERMISSION_LIST.map(
  (key) =>
    PERMISSION_DEFINITIONS_BY_KEY.get(key) ?? {
      key,
      label: getPermissionLabel(key),
      category: "Team & Access",
    },
);

export function getPermissionDefinition(perm: string): PermissionDefinition {
  return (
    PERMISSION_DEFINITIONS_BY_KEY.get(perm) ?? {
      key: perm,
      label: getPermissionLabel(perm),
      category: "Team & Access",
    }
  );
}

export function hasPermission(
  rolePermissions: string[],
  perm: Permission | string,
): boolean {
  return rolePermissions.includes(perm);
}

export function getPermissionLabel(perm: string): string {
  return perm
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
