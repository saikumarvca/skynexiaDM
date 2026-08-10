import {
  Activity,
  BarChart3,
  CalendarClock,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Home,
  Layers,
  LayoutTemplate,
  Loader2,
  MessageSquare,
  Package,
  Search,
  Settings,
  Shield,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Users2,
  Megaphone,
  ThumbsUp,
  Share2,
  Tv,
} from "lucide-react";
import type { Group, SearchItem } from "./types";

export const GROUPS: Group[] = [
  { name: "Main", icon: Home, description: "Dashboard, Analytics, Settings" },
  {
    name: "Reviews",
    icon: FileText,
    description: "Drafts, Allocations, Analytics",
  },
  {
    name: "Posts",
    icon: Megaphone,
    description: "Likes, shares, scheduled post metrics",
  },
  {
    name: "Channels",
    icon: Tv,
    description: "Subscriber metrics by channel",
  },
  { name: "Team", icon: Users2, description: "Users, Roles, Workload" },
  { name: "Clients", icon: Users, description: "Client list, Add client" },
  {
    name: "Campaigns",
    icon: Target,
    description: "All campaigns, New campaign",
  },
  { name: "Content", icon: Layers, description: "Content bank, SEO, Keywords" },
  { name: "Leads", icon: TrendingUp, description: "All leads, Pipeline" },
  { name: "Tasks", icon: ClipboardList, description: "All tasks, New task" },
  {
    name: "Analytics",
    icon: BarChart3,
    description: "Dashboard, Reviews, Performance",
  },
  {
    name: "Settings",
    icon: Settings,
    description: "App settings, Notifications",
  },
];

export const ALL_ITEMS: SearchItem[] = [
  // Main
  { name: "Dashboard", href: "/dashboard", group: "Main", icon: Home },
  {
    name: "Connect",
    href: "/connect-wall",
    group: "Main",
    icon: MessageSquare,
    keywords: "slack chat team org",
  },
  {
    name: "Analytics",
    href: "/analytics",
    group: "Analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    group: "Settings",
    icon: Settings,
  },
  {
    name: "Item master",
    href: "/settings/item-master",
    group: "Settings",
    icon: Package,
    keywords: "invoice catalog sku products services billing",
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    group: "Settings",
    icon: Activity,
  },

  // Clients
  {
    name: "All Clients",
    href: "/clients",
    group: "Clients",
    icon: Users,
    keywords: "client list",
  },
  {
    name: "Add New Client",
    href: "/clients/new",
    group: "Clients",
    icon: Users,
    keywords: "create client",
  },

  // Campaigns
  {
    name: "All Campaigns",
    href: "/campaigns",
    group: "Campaigns",
    icon: Target,
  },
  {
    name: "New Campaign",
    href: "/campaigns/new",
    group: "Campaigns",
    icon: Target,
    keywords: "create campaign",
  },

  // Leads
  {
    name: "All Leads",
    href: "/leads",
    group: "Leads",
    icon: TrendingUp,
  },
  {
    name: "New Lead",
    href: "/leads/new",
    group: "Leads",
    icon: TrendingUp,
    keywords: "create lead",
  },

  // Content
  {
    name: "Content Bank",
    href: "/content",
    group: "Content",
    icon: Layers,
  },
  {
    name: "New Content",
    href: "/content/new",
    group: "Content",
    icon: Layers,
    keywords: "create content",
  },
  {
    name: "Scheduled posts",
    href: "/content/scheduled-posts",
    group: "Content",
    icon: CalendarClock,
    keywords: "calendar publish",
  },
  {
    name: "New scheduled post",
    href: "/content/scheduled-posts/new",
    group: "Content",
    icon: CalendarClock,
  },
  {
    name: "SEO / Keywords",
    href: "/seo",
    group: "Content",
    icon: Search,
    keywords: "seo keywords",
  },
  {
    name: "New Keyword",
    href: "/seo/new",
    group: "Content",
    icon: Search,
    keywords: "add keyword",
  },

  // Tasks
  {
    name: "All Tasks",
    href: "/tasks",
    group: "Tasks",
    icon: ClipboardList,
  },
  {
    name: "New Task",
    href: "/tasks/new",
    group: "Tasks",
    icon: ClipboardList,
    keywords: "create task",
  },

  // Reviews
  {
    name: "Reviews Overview",
    href: "/reviews",
    group: "Reviews",
    icon: FileText,
  },
  {
    name: "Review Drafts",
    href: "/reviews/drafts",
    group: "Reviews",
    icon: ClipboardCheck,
    keywords: "draft bank",
  },
  {
    name: "Review Allocations",
    href: "/reviews/allocations",
    group: "Reviews",
    icon: UserPlus,
    keywords: "assign review",
  },
  {
    name: "My Assigned Reviews",
    href: "/reviews/my-assigned",
    group: "Reviews",
    icon: UserCheck,
  },
  {
    name: "Used Reviews",
    href: "/reviews/used",
    group: "Reviews",
    icon: CheckCircle,
    keywords: "posted reviews",
  },
  {
    name: "Review Analytics",
    href: "/reviews/analytics",
    group: "Reviews",
    icon: BarChart3,
  },
  {
    name: "Review templates",
    href: "/reviews/templates",
    group: "Reviews",
    icon: LayoutTemplate,
    keywords: "prefill review",
  },

  // Posts
  {
    name: "Posts Overview",
    href: "/posts",
    group: "Posts",
    icon: Megaphone,
  },
  {
    name: "Post likes",
    href: "/posts/like",
    group: "Posts",
    icon: ThumbsUp,
    keywords: "engagement metrics",
  },
  {
    name: "Post shares",
    href: "/posts/share",
    group: "Posts",
    icon: Share2,
    keywords: "engagement metrics",
  },

  // Channels
  {
    name: "Channels Overview",
    href: "/channels",
    group: "Channels",
    icon: Tv,
  },
  {
    name: "Channel subscribers",
    href: "/channels/subscribe",
    group: "Channels",
    icon: Users,
    keywords: "subscribe youtube",
  },

  // Analytics
  {
    name: "Dashboard Analytics",
    href: "/analytics",
    group: "Analytics",
    icon: BarChart3,
  },
  {
    name: "Review Analytics",
    href: "/analytics/reviews",
    group: "Analytics",
    icon: BarChart3,
  },
  {
    name: "Team Performance",
    href: "/team/performance",
    group: "Analytics",
    icon: TrendingUp,
  },

  // Team
  { name: "Team Overview", href: "/team", group: "Team", icon: Users2 },
  {
    name: "Users",
    href: "/team/members",
    group: "Team",
    icon: Users,
    keywords: "employees staff team members",
  },
  {
    name: "Add Team Member",
    href: "/team/members/new",
    group: "Team",
    icon: Users,
    keywords: "create employee",
  },
  {
    name: "Team Roles",
    href: "/team/roles",
    group: "Team",
    icon: UserCheck,
    keywords: "permissions",
  },
  { name: "New Role", href: "/team/roles/new", group: "Team", icon: UserCheck },
  {
    name: "Team Assignments",
    href: "/team/assignments",
    group: "Team",
    icon: ClipboardList,
  },
  {
    name: "New Assignment",
    href: "/team/assignments/new",
    group: "Team",
    icon: ClipboardList,
  },
  {
    name: "Team Workload",
    href: "/team/workload",
    group: "Team",
    icon: Loader2,
  },
  {
    name: "Team Activity",
    href: "/team/activity",
    group: "Team",
    icon: Activity,
    keywords: "audit log",
  },
  {
    name: "Review Assignments",
    href: "/team/review-assignments",
    group: "Team",
    icon: ClipboardCheck,
  },

  // Settings
  {
    name: "Admin users",
    href: "/admin/users",
    group: "Settings",
    icon: Shield,
    keywords: "accounts rbac",
    adminOnly: true,
  },
  {
    name: "Settings",
    href: "/settings",
    group: "Settings",
    icon: Settings,
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    group: "Settings",
    icon: Activity,
  },
];

