"use client"

import { useState, useMemo } from "react"
import { formatDistanceToNow, format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ReviewLog {
  _id: string
  entityType: string
  entityId: string
  action: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  performedBy: string
  performedAt: string
}

interface TeamLog {
  _id: string
  userId: string
  userName: string
  action: string
  module: string
  entityType: string
  entityId: string
  targetName?: string
  details?: Record<string, unknown>
  createdAt: string
}

type UnifiedLog =
  | { type: "review"; data: ReviewLog; timestamp: Date }
  | { type: "team"; data: TeamLog; timestamp: Date }

interface AuditLogClientProps {
  reviewLogs: ReviewLog[]
  teamLogs: TeamLog[]
}

const PAGE_SIZE = 50

function timeAgo(date: Date): string {
  try {
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return "Unknown"
  }
}

function absoluteDate(date: Date): string {
  try {
    return format(date, "PPpp")
  } catch {
    return "Unknown"
  }
}

export function AuditLogClient({ reviewLogs, teamLogs }: AuditLogClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "review" | "team">("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)

  const unified: UnifiedLog[] = useMemo(() => {
    const items: UnifiedLog[] = [
      ...reviewLogs.map((r): UnifiedLog => ({
        type: "review",
        data: r,
        timestamp: new Date(r.performedAt),
      })),
      ...teamLogs.map((t): UnifiedLog => ({
        type: "team",
        data: t,
        timestamp: new Date(t.createdAt),
      })),
    ]
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return items
  }, [reviewLogs, teamLogs])

  const filtered = useMemo(() => {
    let items = unified

    if (activeTab === "review") items = items.filter((i) => i.type === "review")
    if (activeTab === "team") items = items.filter((i) => i.type === "team")

    if (dateFrom) {
      const from = startOfDay(parseISO(dateFrom))
      items = items.filter((i) => isAfter(i.timestamp, from) || i.timestamp.getTime() === from.getTime())
    }
    if (dateTo) {
      const to = endOfDay(parseISO(dateTo))
      items = items.filter((i) => isBefore(i.timestamp, to) || i.timestamp.getTime() === to.getTime())
    }

    return items
  }, [unified, activeTab, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleTabChange(tab: "all" | "review" | "team") {
    setActiveTab(tab)
    setPage(1)
  }

  function handleDateChange() {
    setPage(1)
  }

  function renderDetails(log: UnifiedLog): string {
    if (log.type === "review") {
      const r = log.data
      const parts: string[] = [`Entity: ${r.entityType} (${r.entityId})`]
      if (r.newValue && Object.keys(r.newValue).length > 0) {
        parts.push(`New: ${JSON.stringify(r.newValue).slice(0, 100)}`)
      }
      return parts.join(" | ")
    } else {
      const t = log.data
      const parts: string[] = [`Module: ${t.module}`]
      if (t.targetName) parts.push(`Target: ${t.targetName}`)
      if (t.details && Object.keys(t.details).length > 0) {
        parts.push(`Details: ${JSON.stringify(t.details).slice(0, 80)}`)
      }
      return parts.join(" | ")
    }
  }

  function renderUser(log: UnifiedLog): string {
    if (log.type === "review") return log.data.performedBy
    return log.data.userName
  }

  function renderAction(log: UnifiedLog): string {
    if (log.type === "review") return log.data.action
    return log.data.action
  }

  const tabs: { key: "all" | "review" | "team"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "review", label: "Review Activity" },
    { key: "team", label: "Team Activity" },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={[
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter by date range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); handleDateChange() }}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); handleDateChange() }}
                className="w-44"
              />
            </div>
            {(dateFrom || dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1) }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Action / Event</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No activity found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((log, idx) => (
                    <tr
                      key={`${log.type}-${log.data._id}-${idx}`}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          title={absoluteDate(log.timestamp)}
                          className="cursor-default text-muted-foreground"
                        >
                          {timeAgo(log.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            log.type === "review"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
                          ].join(" ")}
                        >
                          {log.type === "review" ? "Review" : "Team"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{renderAction(log)}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        <span title={renderDetails(log)}>{renderDetails(log)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{renderUser(log)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} entries
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
