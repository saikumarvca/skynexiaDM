"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { OverviewView, type DashboardRecentClientRow } from "@/components/dashboard/views/overview-view"
import { OperationsView } from "@/components/dashboard/views/operations-view"
import { ContentReviewsView } from "@/components/dashboard/views/content-reviews-view"
import { GrowthView } from "@/components/dashboard/views/growth-view"
import { TechnicalView } from "@/components/dashboard/views/technical-view"
import type { DashboardPageData } from "@/types"
import {
  DASHBOARD_VIEW_STORAGE_KEY,
  parseDashboardViewParam,
  isSavedDashboardViewAllowed,
  type DashboardViewId,
} from "@/lib/dashboard/views-config"

function viewBody(view: DashboardViewId, data: DashboardPageData, recent: DashboardRecentClientRow[]) {
  switch (view) {
    case "overview":
      return <OverviewView data={data} recentClients={recent} />
    case "operations":
      return <OperationsView data={data} />
    case "content":
      return <ContentReviewsView data={data} />
    case "growth":
      return <GrowthView data={data} />
    case "technical":
      if (data.technical) return <TechnicalView technical={data.technical} />
      return null
    default:
      return <OverviewView data={data} recentClients={recent} />
  }
}

export function DashboardShell({
  data,
  recentClients,
  userName,
  isAdmin,
}: {
  data: DashboardPageData
  recentClients: DashboardRecentClientRow[]
  userName: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const appliedSaved = useRef(false)
  const sanitizedForbidden = useRef(false)

  const view = parseDashboardViewParam(searchParams.get("view"), isAdmin)

  useEffect(() => {
    const raw = searchParams.get("view")
    if (!sanitizedForbidden.current && raw === "technical" && !isAdmin) {
      sanitizedForbidden.current = true
      router.replace(pathname, { scroll: false })
      return
    }
    if (appliedSaved.current) return
    const param = searchParams.get("view")
    if (param != null && param !== "") {
      appliedSaved.current = true
      return
    }
    try {
      const saved = localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY)
      if (saved && isSavedDashboardViewAllowed(saved, isAdmin)) {
        appliedSaved.current = true
        router.replace(`${pathname}?view=${encodeURIComponent(saved)}`, { scroll: false })
      }
    } catch {
      /* ignore */
    }
    appliedSaved.current = true
  }, [isAdmin, pathname, router, searchParams])

  function setView(next: DashboardViewId) {
    try {
      localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    router.replace(`${pathname}?view=${encodeURIComponent(next)}`, { scroll: false })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <DashboardHero userName={userName} view={view} />
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-xs lg:w-64">
          <span id="dashboard-view-label" className="text-xs font-medium text-muted-foreground">
            Dashboard type
          </span>
          <Select value={view} onValueChange={(v) => setView(v as DashboardViewId)}>
            <SelectTrigger
              id="dashboard-view"
              className="bg-background"
              aria-labelledby="dashboard-view-label"
            >
              <SelectValue placeholder="Choose dashboard" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="content">Content &amp; reviews</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
              {isAdmin ? <SelectItem value="technical">Technical</SelectItem> : null}
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewBody(view, data, recentClients)}
    </div>
  )
}
