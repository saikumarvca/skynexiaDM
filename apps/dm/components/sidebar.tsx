"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  Loader2,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Target },
  { name: "Content", href: "/dashboard/content", icon: Layers },
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

export function Sidebar() {
  const pathname = usePathname()
  const isReviewActive =
    pathname === "/dashboard/reviews" ||
    pathname.startsWith("/dashboard/review-") ||
    pathname === "/dashboard/my-assigned-reviews" ||
    pathname === "/dashboard/used-reviews"
  const isTeamActive = pathname.startsWith("/team")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Reviews: isReviewActive,
    Team: isTeamActive,
  })

  useEffect(() => {
    if (isReviewActive) setExpandedSections((p) => ({ ...p, Reviews: true }))
  }, [pathname, isReviewActive])
  useEffect(() => {
    if (isTeamActive) setExpandedSections((p) => ({ ...p, Team: true }))
  }, [pathname, isTeamActive])

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">DM Dashboard</h1>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {navigation.map((item) => {
          if ("children" in item && item.children) {
            const sectionActive = item.name === "Reviews" ? isReviewActive : item.name === "Team" ? isTeamActive : false
            const isExpanded = sectionActive || !!expandedSections[item.name]
            const isParentActive = pathname === item.href
            return (
              <div key={item.name}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSections((p) => ({ ...p, [item.name]: !p[item.name] }))
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isParentActive || sectionActive
                      ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-200 dark:border-gray-700 pl-3">
                    {item.children.map((child) => {
                      const isChildActive =
                        pathname === child.href || pathname.startsWith(`${child.href}/`)
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                            isChildActive
                              ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100 font-medium"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                          )}
                        >
                          <child.icon className="mr-2 h-4 w-4 shrink-0" />
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}