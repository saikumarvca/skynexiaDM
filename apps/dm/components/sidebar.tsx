"use client"

import { useState, useEffect, useLayoutEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"

const SIDEBAR_COLLAPSED_KEY = "dm-sidebar-collapsed"

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

function persistCollapsed(next: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0")
    document.documentElement.toggleAttribute("data-sidebar-collapsed", next)
  } catch {
    /* ignore */
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  /** Restore width before paint on every mount (layout remounts on each in-app navigation). */
  useLayoutEffect(() => {
    try {
      const c = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"
      setCollapsed(c)
      document.documentElement.toggleAttribute("data-sidebar-collapsed", c)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      persistCollapsed(next)
      return next
    })
  }, [])

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
    <div
      id="app-sidebar"
      className={cn(
        "flex h-full shrink-0 flex-col border-r bg-card transition-[width] duration-200 ease-out",
        collapsed ? "w-[4.25rem]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b gap-2",
          collapsed ? "flex-col justify-center px-1 py-2 gap-1.5" : "px-4 gap-2.5"
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
            DM Dashboard
          </h1>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0 text-muted-foreground", collapsed && "mt-0.5")}
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav
        className={cn(
          "flex-1 space-y-0.5 overflow-y-auto py-4 scrollbar-thin",
          collapsed ? "px-1.5" : "px-3"
        )}
      >
        {navigation.map((item) => {
          if ("children" in item && item.children) {
            const sectionActive =
              item.name === "Reviews"
                ? isReviewActive
                : item.name === "Team"
                  ? isTeamActive
                  : false
            const isExpanded = sectionActive || !!expandedSections[item.name]
            const isParentActive = pathname === item.href

            if (collapsed) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={`${item.name} — expand sidebar for full menu`}
                  className={cn(
                    "flex items-center justify-center rounded-md py-2.5 text-sm font-medium transition-colors",
                    isParentActive || sectionActive
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </Link>
              )
            }

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
                      ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex min-w-0 items-center">
                    <item.icon className="mr-3 h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
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
                              ? "bg-primary/10 font-medium text-primary dark:bg-primary/20"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <child.icon className="mr-2 h-3.5 w-3.5 shrink-0" />
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
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center py-2.5" : "px-3 py-2",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", !collapsed && "mr-3")} />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}