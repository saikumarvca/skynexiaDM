"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { buildDashboardNavItems } from "@/lib/dashboard-navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const HOVER_CLOSE_MS = 220;

function isAnalyticsSectionPath(p: string) {
  return (
    p.startsWith("/dashboard/analytics") ||
    p.startsWith("/dashboard/social-analytics") ||
    p.startsWith("/dashboard/review-analytics") ||
    p.startsWith("/dashboard/budget-pacing") ||
    p.startsWith("/dashboard/leads") ||
    p.startsWith("/dashboard/seo") ||
    p.startsWith("/team/performance") ||
    p.startsWith("/dashboard/time-tracking")
  );
}

function sectionStillActiveForPath(name: string, p: string): boolean {
  if (name === "Clients") return p.startsWith("/clients");
  if (name === "Campaigns") return p.startsWith("/dashboard/campaigns");
  if (name === "Content")
    return (
      p.startsWith("/dashboard/content") ||
      p.startsWith("/dashboard/scheduled-posts")
    );
  if (name === "SEO") return p.startsWith("/dashboard/seo");
  if (name === "Leads") return p.startsWith("/dashboard/leads");
  if (name === "Tasks") return p.startsWith("/dashboard/tasks");
  if (name === "Reviews")
    return (
      p === "/dashboard/reviews" ||
      p.startsWith("/dashboard/review-") ||
      p === "/dashboard/my-assigned-reviews" ||
      p === "/dashboard/used-reviews" ||
      p.startsWith("/dashboard/review-requests")
    );
  if (name === "Team") return p.startsWith("/team");
  if (name === "Admin") return p.startsWith("/dashboard/admin");
  if (name === "Reports") return p.startsWith("/dashboard/reports");
  if (name === "Invoices") return p.startsWith("/dashboard/invoices");
  if (name === "Help") return p.startsWith("/dashboard/help");
  if (name === "Analytics") return isAnalyticsSectionPath(p);
  return false;
}

export function DashboardNavLinks({
  isAdmin = false,
  permissions = [],
  collapsed = false,
  onLinkClick,
  className,
}: {
  isAdmin?: boolean;
  permissions?: string[];
  collapsed?: boolean;
  onLinkClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const navItems = buildDashboardNavItems(isAdmin, permissions);

  const isClientsActive = pathname.startsWith("/clients");
  const isCampaignsActive = pathname.startsWith("/dashboard/campaigns");
  const isContentActive =
    pathname.startsWith("/dashboard/content") ||
    pathname.startsWith("/dashboard/scheduled-posts");
  const isSeoActive = pathname.startsWith("/dashboard/seo");
  const isLeadsActive = pathname.startsWith("/dashboard/leads");
  const isTasksActive = pathname.startsWith("/dashboard/tasks");
  const isReviewActive =
    pathname === "/dashboard/reviews" ||
    pathname.startsWith("/dashboard/review-") ||
    pathname === "/dashboard/my-assigned-reviews" ||
    pathname === "/dashboard/used-reviews" ||
    pathname.startsWith("/dashboard/review-requests");
  const isTeamActive = pathname.startsWith("/team");
  const isAdminActive = pathname.startsWith("/dashboard/admin");
  const isReportsActive = pathname.startsWith("/dashboard/reports");
  const isInvoicesActive = pathname.startsWith("/dashboard/invoices");
  const isHelpActive = pathname.startsWith("/dashboard/help");
  const isAnalyticsActive = isAnalyticsSectionPath(pathname);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    Clients: isClientsActive,
    Campaigns: isCampaignsActive,
    Content: isContentActive,
    SEO: isSeoActive,
    Leads: isLeadsActive,
    Tasks: isTasksActive,
    Reviews: isReviewActive,
    Team: isTeamActive,
    Admin: isAdminActive,
    Reports: isReportsActive,
    Invoices: isInvoicesActive,
    Help: isHelpActive,
    Analytics: isAnalyticsActive,
  });

  const [manuallyClosed, setManuallyClosed] = useState<Record<string, boolean>>({});

  const flyoutCloseTimers = useRef<Map<string, number>>(new Map());
  const [flyoutOpen, setFlyoutOpen] = useState<string | null>(null);

  const cancelFlyoutClose = useCallback((name: string) => {
    const t = flyoutCloseTimers.current.get(name);
    if (t) {
      clearTimeout(t);
      flyoutCloseTimers.current.delete(name);
    }
  }, []);

  const scheduleFlyoutClose = useCallback(
    (name: string) => {
      cancelFlyoutClose(name);
      const id = window.setTimeout(() => {
        flyoutCloseTimers.current.delete(name);
        setFlyoutOpen((cur) => (cur === name ? null : cur));
      }, HOVER_CLOSE_MS) as unknown as number;
      flyoutCloseTimers.current.set(name, id);
    },
    [cancelFlyoutClose],
  );

  const openFlyout = useCallback(
    (name: string) => {
      cancelFlyoutClose(name);
      setFlyoutOpen(name);
    },
    [cancelFlyoutClose],
  );

  useEffect(() => {
    if (isClientsActive) setExpandedSections((p) => ({ ...p, Clients: true }));
  }, [pathname, isClientsActive]);
  useEffect(() => {
    if (isCampaignsActive)
      setExpandedSections((p) => ({ ...p, Campaigns: true }));
  }, [pathname, isCampaignsActive]);
  useEffect(() => {
    if (isContentActive) setExpandedSections((p) => ({ ...p, Content: true }));
  }, [pathname, isContentActive]);
  useEffect(() => {
    if (isSeoActive) setExpandedSections((p) => ({ ...p, SEO: true }));
  }, [pathname, isSeoActive]);
  useEffect(() => {
    if (isLeadsActive) setExpandedSections((p) => ({ ...p, Leads: true }));
  }, [pathname, isLeadsActive]);
  useEffect(() => {
    if (isTasksActive) setExpandedSections((p) => ({ ...p, Tasks: true }));
  }, [pathname, isTasksActive]);
  useEffect(() => {
    if (isReviewActive) setExpandedSections((p) => ({ ...p, Reviews: true }));
  }, [pathname, isReviewActive]);
  useEffect(() => {
    if (isTeamActive) setExpandedSections((p) => ({ ...p, Team: true }));
  }, [pathname, isTeamActive]);
  useEffect(() => {
    if (isAdminActive) setExpandedSections((p) => ({ ...p, Admin: true }));
  }, [pathname, isAdminActive]);
  useEffect(() => {
    if (isReportsActive) setExpandedSections((p) => ({ ...p, Reports: true }));
  }, [pathname, isReportsActive]);
  useEffect(() => {
    if (isInvoicesActive)
      setExpandedSections((p) => ({ ...p, Invoices: true }));
  }, [pathname, isInvoicesActive]);
  useEffect(() => {
    if (isHelpActive) setExpandedSections((p) => ({ ...p, Help: true }));
  }, [pathname, isHelpActive]);
  useEffect(() => {
    if (isAnalyticsActive)
      setExpandedSections((p) => ({ ...p, Analytics: true }));
  }, [pathname, isAnalyticsActive]);

  // When the user navigates into a section, clear any manual-close override
  // so the section auto-expands to show the active child.
  useEffect(() => {
    setManuallyClosed((prev) => {
      const next = { ...prev };
      const sectionMap: Record<string, boolean> = {
        Clients: isClientsActive,
        Campaigns: isCampaignsActive,
        Content: isContentActive,
        SEO: isSeoActive,
        Leads: isLeadsActive,
        Tasks: isTasksActive,
        Reviews: isReviewActive,
        Team: isTeamActive,
        Admin: isAdminActive,
        Reports: isReportsActive,
        Invoices: isInvoicesActive,
        Help: isHelpActive,
        Analytics: isAnalyticsActive,
      };
      Object.entries(sectionMap).forEach(([name, active]) => {
        if (active) delete next[name];
      });
      return next;
    });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      flyoutCloseTimers.current.forEach(clearTimeout);
    };
  }, []);

  const linkAfterNav = () => {
    onLinkClick?.();
  };

  const sectionStillActive = (name: string) => {
    if (name === "Clients") return isClientsActive;
    if (name === "Campaigns") return isCampaignsActive;
    if (name === "Content") return isContentActive;
    if (name === "SEO") return isSeoActive;
    if (name === "Leads") return isLeadsActive;
    if (name === "Tasks") return isTasksActive;
    if (name === "Reviews") return isReviewActive;
    if (name === "Team") return isTeamActive;
    if (name === "Admin") return isAdminActive;
    if (name === "Reports") return isReportsActive;
    if (name === "Invoices") return isInvoicesActive;
    if (name === "Help") return isHelpActive;
    if (name === "Analytics") return isAnalyticsActive;
    return false;
  };

  return (
    <nav
      className={cn("space-y-0.5", collapsed ? "px-1.5" : "px-3", className)}
    >
      {navItems.map((item) => {
        if ("children" in item && item.children) {
          const sectionActive = sectionStillActive(item.name);
          const isExpanded =
            (sectionActive || !!expandedSections[item.name]) &&
            !manuallyClosed[item.name];
          const isParentActive = pathname === item.href;

          if (collapsed) {
            return (
              <Popover
                key={item.name}
                open={flyoutOpen === item.name}
                onOpenChange={(open) => {
                  if (!open) {
                    cancelFlyoutClose(item.name);
                    setFlyoutOpen((cur) => (cur === item.name ? null : cur));
                  }
                }}
                modal={false}
              >
                <div
                  onMouseEnter={() => openFlyout(item.name)}
                  onMouseLeave={() => scheduleFlyoutClose(item.name)}
                >
                  <PopoverTrigger asChild>
                    <Link
                      href={item.href}
                      title={`${item.name} — hover for more`}
                      onClick={linkAfterNav}
                      className={cn(
                        "flex items-center justify-center rounded-md py-2.5 text-sm font-medium transition-colors",
                        isParentActive || sectionActive
                          ? "bg-primary/10 text-primary dark:bg-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                    </Link>
                  </PopoverTrigger>
                </div>
                <PopoverContent
                  side="right"
                  align="center"
                  sideOffset={8}
                  collisionPadding={12}
                  avoidCollisions={false}
                  data-nav-collapsed-flyout=""
                  className="flex min-h-0 w-56 flex-1 flex-col overflow-hidden p-1.5"
                  onMouseEnter={() => cancelFlyoutClose(item.name)}
                  onMouseLeave={() => scheduleFlyoutClose(item.name)}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <p className="mb-1.5 shrink-0 px-2 pt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.name}
                  </p>
                  <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="flex flex-col gap-0.5">
                      {item.children.map((child) => {
                        const isChildActive =
                          pathname === child.href ||
                          pathname.startsWith(`${child.href}/`);
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => {
                              linkAfterNav();
                              setFlyoutOpen(null);
                            }}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                              isChildActive
                                ? "bg-primary/10 font-medium text-primary dark:bg-primary/20"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          const sectionId = `nav-section-${item.name.toLowerCase().replace(/\s+/g, "-")}`;
          return (
            <div
              key={item.name}
              className="rounded-md"
            >
              <button
                type="button"
                id={`${sectionId}-trigger`}
                aria-expanded={isExpanded}
                aria-controls={sectionId}
                onClick={() => {
                  if (isExpanded) {
                    // User is explicitly closing — record manual close
                    setManuallyClosed((p) => ({ ...p, [item.name]: true }));
                    setExpandedSections((p) => ({
                      ...p,
                      [item.name]: false,
                    }));
                  } else {
                    // User is opening — clear manual close
                    setManuallyClosed((p) => ({ ...p, [item.name]: false }));
                    setExpandedSections((p) => ({
                      ...p,
                      [item.name]: true,
                    }));
                  }
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isParentActive || sectionActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <div className="flex min-w-0 items-center">
                  <item.icon className="mr-3 h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown
                    className="h-3.5 w-3.5 shrink-0 opacity-60"
                    aria-hidden
                  />
                ) : (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 opacity-60"
                    aria-hidden
                  />
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
                      pathname === child.href ||
                      pathname.startsWith(`${child.href}/`);
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={linkAfterNav}
                        className={cn(
                          "flex items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                          isChildActive
                            ? "bg-primary/10 font-medium text-primary dark:bg-primary/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <child.icon className="mr-2 h-3.5 w-3.5 shrink-0" />
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon
              className={cn("h-4 w-4 shrink-0", !collapsed && "mr-3")}
            />
            {!collapsed && item.name}
          </Link>
        );
      })}
    </nav>
  );
}
