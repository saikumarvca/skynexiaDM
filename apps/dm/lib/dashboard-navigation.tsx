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
};

export type DashboardNavItem =
  | {
      name: string;
      href: string;
      icon: LucideIcon;
    }
  | {
      name: string;
      href: string;
      icon: LucideIcon;
      children: DashboardNavChild[];
    };

const baseNavigation: DashboardNavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Connect", href: "/connect-wall", icon: MessageSquare },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
    children: [
      { name: "All Clients", href: "/clients", icon: Users },
      { name: "Add Client", href: "/clients/new", icon: Plus },
      { name: "Archived", href: "/clients?archived=1", icon: Archive },
      {
        name: "Google Reviews",
        href: "/dashboard/google-reviews",
        icon: CheckCircle,
      },
    ],
  },
  {
    name: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Target,
    children: [
      { name: "All Campaigns", href: "/dashboard/campaigns", icon: Target },
      { name: "New Campaign", href: "/dashboard/campaigns/new", icon: Plus },
      {
        name: "Budget Pacing",
        href: "/dashboard/budget-pacing",
        icon: AlertTriangle,
      },
      {
        name: "Archived",
        href: "/dashboard/campaigns?archived=1",
        icon: Archive,
      },
    ],
  },
  {
    name: "Content",
    href: "/dashboard/content",
    icon: Layers,
    children: [
      { name: "Content Bank", href: "/dashboard/content", icon: Layers },
      { name: "New Content", href: "/dashboard/content/new", icon: Plus },
      {
        name: "Scheduled Posts",
        href: "/dashboard/scheduled-posts",
        icon: CalendarClock,
      },
      {
        name: "New Scheduled Post",
        href: "/dashboard/scheduled-posts/new",
        icon: CalendarClock,
      },
    ],
  },
  {
    name: "SEO",
    href: "/dashboard/seo",
    icon: Search,
    children: [
      { name: "Keywords", href: "/dashboard/seo", icon: Hash },
      { name: "Add Keyword", href: "/dashboard/seo/new", icon: Plus },
      { name: "Competitors", href: "/dashboard/seo/competitors", icon: Globe },
    ],
  },
  {
    name: "Leads",
    href: "/dashboard/leads",
    icon: TrendingUp,
    children: [
      { name: "All Leads", href: "/dashboard/leads", icon: TrendingUp },
      {
        name: "Kanban Board",
        href: "/dashboard/leads?view=kanban",
        icon: Columns3,
      },
      { name: "Add Lead", href: "/dashboard/leads/new", icon: Plus },
    ],
  },
  {
    name: "Tasks",
    href: "/dashboard/tasks",
    icon: ClipboardList,
    children: [
      { name: "All Tasks", href: "/dashboard/tasks", icon: ListChecks },
      { name: "New Task", href: "/dashboard/tasks/new", icon: Plus },
    ],
  },
  {
    name: "Reviews",
    href: "/dashboard/reviews",
    icon: FileText,
    children: [
      { name: "Overview", href: "/dashboard/reviews", icon: FileText },
      {
        name: "Review Drafts",
        href: "/dashboard/review-drafts",
        icon: ClipboardCheck,
      },
      {
        name: "Review Allocations",
        href: "/dashboard/review-allocations",
        icon: UserPlus,
      },
      {
        name: "My Assigned Reviews",
        href: "/dashboard/my-assigned-reviews",
        icon: UserCheck,
      },
      {
        name: "Used Reviews",
        href: "/dashboard/used-reviews",
        icon: CheckCircle,
      },
      {
        name: "Review Analytics",
        href: "/dashboard/review-analytics",
        icon: BarChart3,
      },
      {
        name: "Review templates",
        href: "/dashboard/review-templates",
        icon: LayoutTemplate,
      },
      {
        name: "Review Requests",
        href: "/dashboard/review-requests",
        icon: Mail,
      },
    ],
  },
  {
    name: "Team",
    href: "/team",
    icon: Users2,
    children: [
      { name: "Overview", href: "/team", icon: Users2 },
      { name: "Users", href: "/team/members", icon: Users },
      { name: "Roles", href: "/team/roles", icon: UserCheck },
      { name: "Assignments", href: "/team/assignments", icon: ClipboardList },
      { name: "Performance", href: "/team/performance", icon: TrendingUp },
      { name: "Workload", href: "/team/workload", icon: Loader2 },
      { name: "Activity", href: "/team/activity", icon: Activity },
      {
        name: "Review Assignments",
        href: "/team/review-assignments",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    children: [
      { name: "Overview", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "Social", href: "/dashboard/social-analytics", icon: BarChart2 },
      { name: "Reviews", href: "/dashboard/review-analytics", icon: Activity },
      {
        name: "Budget & pacing",
        href: "/dashboard/budget-pacing",
        icon: AlertTriangle,
      },
      { name: "Pipeline", href: "/dashboard/leads", icon: TrendingUp },
      { name: "SEO", href: "/dashboard/seo", icon: Hash },
      { name: "Team", href: "/team/performance", icon: Users2 },
      { name: "Time", href: "/dashboard/time-tracking", icon: Clock },
    ],
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: Mail,
    children: [
      { name: "Scheduled Reports", href: "/dashboard/reports", icon: Mail },
      { name: "New Schedule", href: "/dashboard/reports/new", icon: Plus },
    ],
  },
  {
    name: "Invoices",
    href: "/dashboard/invoices",
    icon: DollarSign,
    children: [
      { name: "All Invoices", href: "/dashboard/invoices", icon: DollarSign },
      {
        name: "Accounts receivable",
        href: "/dashboard/invoices/accounts-receivable",
        icon: Wallet,
      },
      { name: "New Invoice", href: "/dashboard/invoices/new", icon: Plus },
    ],
  },
  { name: "Time Tracking", href: "/dashboard/time-tracking", icon: Clock },
  { name: "Integrations", href: "/dashboard/integrations", icon: Zap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  {
    name: "Help",
    href: "/dashboard/help/documentation/overview",
    icon: HelpCircle,
    children: [
      {
        name: "Documentation",
        href: "/dashboard/help/documentation/overview",
        icon: BookOpen,
      },
    ],
  },
];

export function buildDashboardNavItems(isAdmin: boolean): DashboardNavItem[] {
  if (!isAdmin) return baseNavigation;
  const idx = baseNavigation.findIndex((x) => x.name === "Settings");
  if (idx === -1) return baseNavigation;
  const next = [...baseNavigation];
  next.splice(idx, 0, {
    name: "Admin",
    href: "/dashboard/admin/users",
    icon: Shield,
    children: [
      { name: "Users", href: "/dashboard/admin/users", icon: Shield },
      {
        name: "Audit Log",
        href: "/dashboard/admin/audit-log",
        icon: ScrollText,
      },
      { name: "Webhooks", href: "/dashboard/admin/webhooks", icon: Webhook },
    ],
  });
  return next;
}
