"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight } from "lucide-react"
import { buildDashboardNavItems } from "@/lib/dashboard-navigation"

export function DashboardNavLinks({
  isAdmin = false,
  collapsed = false,
  onLinkClick,
  className,
}: {
  isAdmin?: boolean
  collapsed?: boolean
  onLinkClick?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const navItems = buildDashboardNavItems(isAdmin)

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

  const linkAfterNav = () => {
    onLinkClick?.()
  }

  return (
    <nav
      className={cn(
        "space-y-0.5",
        collapsed ? "px-1.5" : "px-3",
        className
      )}
    >
      {navItems.map((item) => {
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
                onClick={linkAfterNav}
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

          const sectionId = `nav-section-${item.name.toLowerCase().replace(/\s+/g, "-")}`
          return (
            <div key={item.name}>
              <button
                type="button"
                id={`${sectionId}-trigger`}
                aria-expanded={isExpanded}
                aria-controls={sectionId}
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
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                )}
              </button>
              {isExpanded && (
                <div
                  id={sectionId}
                  role="region"
                  aria-labelledby={`${sectionId}-trigger`}
                  className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3"
                >
                  {item.children.map((child) => {
                    const isChildActive =
                      pathname === child.href || pathname.startsWith(`${child.href}/`)
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={linkAfterNav}
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
            onClick={linkAfterNav}
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
  )
}
