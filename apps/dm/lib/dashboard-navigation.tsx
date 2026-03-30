import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Users,
  Users2,
  FileText,
  Home,
  Target,
  Layers,
  Search,
  ClipboardList,
  Settings,
  ClipboardCheck,
  UserPlus,
  UserCheck,
  CheckCircle,
  Activity,
  TrendingUp,
  Loader2,
  CalendarClock,
  LayoutTemplate,
  Shield,
  ScrollText,
  Webhook,
  Mail,
  Plus,
  Archive,
  Columns3,
  Hash,
  ListChecks,
  MessageSquare,
  FileText as InvoiceIcon,
  Clock,
  Zap,
  DollarSign,
  Globe,
  BarChart2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Wallet,
} from "lucide-react";

export type DashboardNavChild = {
  name: string;
  href: string;
  icon: LucideIcon;
  requiredAnyOf?: string[];
};

export type DashboardNavItem =
  | {
      name: string;
      href: string;
      icon: LucideIcon;
      requiredAnyOf?: string[];
    }
  | {
      name: string;
      href: string;
      icon: LucideIcon;
      children: DashboardNavChild[];
      requiredAnyOf?: string[];
    };

const baseNavigation: DashboardNavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    requiredAnyOf: ["view_dashboard"],
  },
  {
    name: "Connect",
    href: "/connect-wall",
    icon: MessageSquare,
    requiredAnyOf: [
      "manage_clients",
      "view_clients",
      "manage_leads",
      "view_leads",
      "manage_reviews",
      "view_reviews",
      "work_assigned_reviews",
    ],
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
    requiredAnyOf: ["manage_clients", "view_clients"],
    children: [
      {
        name: "All Clients",
        href: "/clients",
        icon: Users,
        requiredAnyOf: ["manage_clients", "view_clients"],
      },
      {
        name: "Add Client",
        href: "/clients/new",
        icon: Plus,
        requiredAnyOf: ["manage_clients"],
      },
      {
        name: "Archived",
        href: "/clients?archived=1",
        icon: Archive,
        requiredAnyOf: ["manage_clients"],
      },
      {
        name: "Google Reviews",
        href: "/clients/google-reviews",
        icon: CheckCircle,
        requiredAnyOf: ["manage_reviews", "view_reviews"],
      },
    ],
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Target,
    requiredAnyOf: ["manage_campaigns", "view_campaigns"],
    children: [
      {
        name: "All Campaigns",
        href: "/campaigns",
        icon: Target,
        requiredAnyOf: ["manage_campaigns", "view_campaigns"],
      },
      {
        name: "New Campaign",
        href: "/campaigns/new",
        icon: Plus,
        requiredAnyOf: ["manage_campaigns"],
      },
      {
        name: "Budget Pacing",
        href: "/campaigns/budget-pacing",
        icon: AlertTriangle,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "Archived",
        href: "/campaigns?archived=1",
        icon: Archive,
        requiredAnyOf: ["manage_campaigns"],
      },
    ],
  },
  {
    name: "Content",
    href: "/content",
    icon: Layers,
    requiredAnyOf: ["manage_content", "view_content"],
    children: [
      {
        name: "Content Bank",
        href: "/content",
        icon: Layers,
        requiredAnyOf: ["manage_content", "view_content"],
      },
      {
        name: "New Content",
        href: "/content/new",
        icon: Plus,
        requiredAnyOf: ["manage_content"],
      },
      {
        name: "Scheduled Posts",
        href: "/content/scheduled-posts",
        icon: CalendarClock,
        requiredAnyOf: ["manage_content", "view_content"],
      },
      {
        name: "New Scheduled Post",
        href: "/content/scheduled-posts/new",
        icon: CalendarClock,
        requiredAnyOf: ["manage_content"],
      },
    ],
  },
  {
    name: "SEO",
    href: "/seo",
    icon: Search,
    requiredAnyOf: ["manage_seo", "view_seo"],
    children: [
      {
        name: "Keywords",
        href: "/seo",
        icon: Hash,
        requiredAnyOf: ["manage_seo", "view_seo"],
      },
      {
        name: "Add Keyword",
        href: "/seo/new",
        icon: Plus,
        requiredAnyOf: ["manage_seo"],
      },
      {
        name: "Competitors",
        href: "/seo/competitors",
        icon: Globe,
        requiredAnyOf: ["manage_seo", "view_seo"],
      },
    ],
  },
  {
    name: "Leads",
    href: "/leads",
    icon: TrendingUp,
    requiredAnyOf: ["manage_leads", "view_leads"],
    children: [
      {
        name: "All Leads",
        href: "/leads",
        icon: TrendingUp,
        requiredAnyOf: ["manage_leads", "view_leads"],
      },
      {
        name: "Kanban Board",
        href: "/leads?view=kanban",
        icon: Columns3,
        requiredAnyOf: ["manage_leads", "view_leads"],
      },
      {
        name: "Add Lead",
        href: "/leads/new",
        icon: Plus,
        requiredAnyOf: ["manage_leads"],
      },
    ],
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: ClipboardList,
    requiredAnyOf: [
      "manage_tasks",
      "view_tasks",
      "work_assigned_tasks",
      "assign_tasks",
    ],
    children: [
      {
        name: "All Tasks",
        href: "/tasks",
        icon: ListChecks,
        requiredAnyOf: ["manage_tasks", "view_tasks"],
      },
      {
        name: "New Task",
        href: "/tasks/new",
        icon: Plus,
        requiredAnyOf: ["manage_tasks"],
      },
    ],
  },
  {
    name: "Reviews",
    href: "/reviews",
    icon: FileText,
    requiredAnyOf: [
      "manage_reviews",
      "view_reviews",
      "work_assigned_reviews",
      "assign_reviews",
    ],
    children: [
      {
        name: "Overview",
        href: "/reviews",
        icon: FileText,
        requiredAnyOf: ["manage_reviews", "view_reviews"],
      },
      {
        name: "Review Drafts",
        href: "/reviews/drafts",
        icon: ClipboardCheck,
        requiredAnyOf: ["manage_reviews"],
      },
      {
        name: "Review Allocations",
        href: "/reviews/allocations",
        icon: UserPlus,
        requiredAnyOf: ["manage_reviews", "assign_reviews"],
      },
      {
        name: "My Assigned Reviews",
        href: "/reviews/my-assigned",
        icon: UserCheck,
        requiredAnyOf: ["work_assigned_reviews", "view_reviews", "manage_reviews"],
      },
      {
        name: "Used Reviews",
        href: "/reviews/used",
        icon: CheckCircle,
        requiredAnyOf: ["manage_reviews"],
      },
      {
        name: "Review Analytics",
        href: "/reviews/analytics",
        icon: BarChart3,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "Review templates",
        href: "/reviews/templates",
        icon: LayoutTemplate,
        requiredAnyOf: ["manage_reviews"],
      },
      {
        name: "Review Requests",
        href: "/reviews/requests",
        icon: Mail,
        requiredAnyOf: ["manage_reviews"],
      },
    ],
  },
  {
    name: "Team",
    href: "/team",
    icon: Users2,
    requiredAnyOf: ["manage_team", "manage_roles", "assign_tasks", "assign_reviews"],
    children: [
      {
        name: "Overview",
        href: "/team",
        icon: Users2,
        requiredAnyOf: ["manage_team", "manage_roles", "assign_tasks", "assign_reviews"],
      },
      {
        name: "Users",
        href: "/team/members",
        icon: Users,
        requiredAnyOf: ["manage_team"],
      },
      {
        name: "Roles",
        href: "/team/roles",
        icon: UserCheck,
        requiredAnyOf: ["manage_roles"],
      },
      {
        name: "Assignments",
        href: "/team/assignments",
        icon: ClipboardList,
        requiredAnyOf: ["manage_team", "assign_tasks", "assign_reviews"],
      },
      {
        name: "Performance",
        href: "/team/performance",
        icon: TrendingUp,
        requiredAnyOf: ["manage_team"],
      },
      {
        name: "Workload",
        href: "/team/workload",
        icon: Loader2,
        requiredAnyOf: ["manage_team"],
      },
      {
        name: "Activity",
        href: "/team/activity",
        icon: Activity,
        requiredAnyOf: ["manage_team"],
      },
      {
        name: "Review Assignments",
        href: "/team/review-assignments",
        icon: ClipboardCheck,
        requiredAnyOf: ["manage_reviews", "assign_reviews"],
      },
    ],
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    requiredAnyOf: ["view_analytics"],
    children: [
      {
        name: "Overview",
        href: "/analytics",
        icon: BarChart3,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "Social",
        href: "/analytics/social",
        icon: BarChart2,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "Reviews",
        href: "/analytics/reviews",
        icon: Activity,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "Budget & pacing",
        href: "/campaigns/budget-pacing",
        icon: AlertTriangle,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "Pipeline",
        href: "/leads",
        icon: TrendingUp,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "SEO",
        href: "/seo",
        icon: Hash,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "Team",
        href: "/team/performance",
        icon: Users2,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "Time",
        href: "/time-tracking",
        icon: Clock,
        requiredAnyOf: ["view_analytics"],
      },
    ],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: Mail,
    requiredAnyOf: ["view_analytics"],
    children: [
      {
        name: "Scheduled Reports",
        href: "/reports",
        icon: Mail,
        requiredAnyOf: ["view_analytics"],
      },
      {
        name: "New Schedule",
        href: "/reports/new",
        icon: Plus,
        requiredAnyOf: ["view_analytics"],
      },
    ],
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: DollarSign,
    requiredAnyOf: ["manage_clients", "view_clients"],
    children: [
      {
        name: "All Invoices",
        href: "/invoices",
        icon: DollarSign,
        requiredAnyOf: ["manage_clients", "view_clients"],
      },
      {
        name: "Accounts receivable",
        href: "/invoices/accounts-receivable",
        icon: Wallet,
        requiredAnyOf: ["manage_clients"],
      },
      {
        name: "New Invoice",
        href: "/invoices/new",
        icon: Plus,
        requiredAnyOf: ["manage_clients"],
      },
    ],
  },
  {
    name: "Time Tracking",
    href: "/time-tracking",
    icon: Clock,
    requiredAnyOf: ["manage_team", "view_analytics"],
  },
  {
    name: "Integrations",
    href: "/integrations",
    icon: Zap,
    requiredAnyOf: ["manage_settings"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    requiredAnyOf: ["manage_settings"],
  },
  {
    name: "Help",
    href: "/help/documentation/overview",
    icon: HelpCircle,
    children: [
      {
        name: "Documentation",
        href: "/help/documentation/overview",
        icon: BookOpen,
      },
    ],
  },
];

function canAccess(perms: string[], requiredAnyOf?: string[]) {
  if (!requiredAnyOf || requiredAnyOf.length === 0) return true;
  const set = new Set(perms);
  return requiredAnyOf.some((p) => set.has(p));
}

export function buildDashboardNavItems(
  isAdmin: boolean,
  perms: string[] = [],
): DashboardNavItem[] {
  if (isAdmin) {
    const adminItem: DashboardNavItem = {
      name: "Admin",
      href: "/admin/users",
      icon: Shield,
      children: [
        { name: "Users", href: "/admin/users", icon: Shield },
        {
          name: "Audit Log",
          href: "/admin/audit-log",
          icon: ScrollText,
        },
        { name: "Webhooks", href: "/admin/webhooks", icon: Webhook },
      ],
    };

    const idx = baseNavigation.findIndex((x) => x.name === "Settings");
    if (idx === -1) return [...baseNavigation, adminItem];
    const full = [...baseNavigation];
    full.splice(idx, 0, adminItem);
    return full;
  }

  const filtered = baseNavigation
    .map((item) => {
      if (!("children" in item) || !item.children) return item;
      const children = item.children.filter((c) => canAccess(perms, c.requiredAnyOf));
      return { ...item, children };
    })
    .filter((item) => {
      if (!canAccess(perms, item.requiredAnyOf)) return false;
      if ("children" in item && item.children) return item.children.length > 0;
      return true;
    });
  return filtered;
}
