import type { LucideIcon } from "lucide-react"
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
} from "lucide-react"

export type DashboardNavChild = {
  name: string
  href: string
  icon: LucideIcon
}

export type DashboardNavItem =
  | {
      name: string
      href: string
      icon: LucideIcon
    }
  | {
      name: string
      href: string
      icon: LucideIcon
      children: DashboardNavChild[]
    }

const baseNavigation: DashboardNavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Target },
  { name: "Content", href: "/dashboard/content", icon: Layers },
  { name: "Scheduled posts", href: "/dashboard/scheduled-posts", icon: CalendarClock },
  { name: "SEO", href: "/dashboard/seo", icon: Search },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Tasks", href: "/dashboard/tasks", icon: ClipboardList },
  {
    name: "Reviews",
    href: "/dashboard/reviews",
    icon: FileText,
    children: [
      { name: "Overview", href: "/dashboard/reviews", icon: FileText },
      { name: "Review Drafts", href: "/dashboard/review-drafts", icon: ClipboardCheck },
      { name: "Review Allocations", href: "/dashboard/review-allocations", icon: UserPlus },
      { name: "My Assigned Reviews", href: "/dashboard/my-assigned-reviews", icon: UserCheck },
      { name: "Used Reviews", href: "/dashboard/used-reviews", icon: CheckCircle },
      { name: "Review Analytics", href: "/dashboard/review-analytics", icon: BarChart3 },
      { name: "Review templates", href: "/dashboard/review-templates", icon: LayoutTemplate },
    ],
  },
  {
    name: "Team",
    href: "/team",
    icon: Users2,
    children: [
      { name: "Overview", href: "/team", icon: Users2 },
      { name: "Members", href: "/team/members", icon: Users },
      { name: "Roles", href: "/team/roles", icon: UserCheck },
      { name: "Assignments", href: "/team/assignments", icon: ClipboardList },
      { name: "Performance", href: "/team/performance", icon: TrendingUp },
      { name: "Workload", href: "/team/workload", icon: Loader2 },
      { name: "Activity", href: "/team/activity", icon: Activity },
      { name: "Review Assignments", href: "/team/review-assignments", icon: ClipboardCheck },
    ],
  },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function buildDashboardNavItems(isAdmin: boolean): DashboardNavItem[] {
  if (!isAdmin) return baseNavigation
  const idx = baseNavigation.findIndex((x) => x.name === "Settings")
  if (idx === -1) return baseNavigation
  const next = [...baseNavigation]
  next.splice(idx, 0, {
    name: "Admin users",
    href: "/dashboard/admin/users",
    icon: Shield,
  })
  return next
}
