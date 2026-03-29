"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import {
  FileText,
  CheckCircle,
  UserPlus,
  Share2,
  Upload,
  Archive,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyTrend {
  month: string
  used: number
  drafted: number
}

interface PlatformBreakdown {
  platform: string
  count: number
}

interface TopReviewer {
  name: string
  count: number
}

interface ReviewAnalyticsData {
  totalDrafts: number
  available: number
  allocated: number
  shared: number
  used: number
  teamUsage: { name: string; count: number }[]
  platformUsage: { platform: string; count: number }[]
  statusDistribution: Record<string, number>
  dailyTrend: { date: string; count: number }[]
  monthlyTrends: MonthlyTrend[]
  platformBreakdown: PlatformBreakdown[]
  topReviewers: TopReviewer[]
  responseRate: number
}

// ─── SVG Helpers ──────────────────────────────────────────────────────────────

// Dual-line chart for monthly trends
function MonthlyTrendsChart({
  data,
}: {
  data: MonthlyTrend[]
}) {
  const W = 400
  const H = 140
  const PAD = { top: 20, right: 20, bottom: 36, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const n = data.length
  if (n === 0) return <p className="text-sm text-muted-foreground">No data yet.</p>

  const allVals = data.flatMap((d) => [d.used, d.drafted])
  const maxVal = Math.max(...allVals, 1)

  function toPoint(i: number, val: number) {
    const x = PAD.left + (i / Math.max(n - 1, 1)) * chartW
    const y = PAD.top + chartH - (val / maxVal) * chartH
    return { x, y }
  }

  const usedPts = data.map((d, i) => toPoint(i, d.used))
  const draftedPts = data.map((d, i) => toPoint(i, d.drafted))

  const toPolyline = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ")

  // short month label
  const label = (m: string) => {
    const [, mo] = m.split("-")
    return new Date(2000, Number(mo) - 1, 1).toLocaleString("en", {
      month: "short",
    })
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      aria-label="Monthly trends line chart"
      role="img"
      style={{ overflow: "visible" }}
    >
      {/* axes */}
      <line
        x1={PAD.left} y1={PAD.top}
        x2={PAD.left} y2={PAD.top + chartH}
        stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
      />
      <line
        x1={PAD.left} y1={PAD.top + chartH}
        x2={PAD.left + chartW} y2={PAD.top + chartH}
        stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
      />

      {/* drafted line (blue) */}
      <polyline
        points={toPolyline(draftedPts)}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* used line (green) */}
      <polyline
        points={toPolyline(usedPts)}
        fill="none"
        stroke="#22c55e"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* dots + x labels */}
      {data.map((d, i) => {
        const up = usedPts[i]
        const dp = draftedPts[i]
        return (
          <g key={d.month}>
            <circle cx={dp.x} cy={dp.y} r={3} fill="#3b82f6" />
            <circle cx={up.x} cy={up.y} r={3} fill="#22c55e" />
            <text
              x={up.x}
              y={PAD.top + chartH + 14}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.6}
            >
              {label(d.month)}
            </text>
          </g>
        )
      })}

      {/* Y max */}
      <text
        x={PAD.left - 4}
        y={PAD.top + 4}
        textAnchor="end"
        fontSize={9}
        fill="currentColor"
        fillOpacity={0.5}
      >
        {maxVal}
      </text>
    </svg>
  )
}

// Horizontal bar chart for platform breakdown
const PLATFORM_COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b",
  "#ef4444", "#14b8a6", "#ec4899", "#8b5cf6",
]

function PlatformHorizontalBars({ data }: { data: PlatformBreakdown[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No platform data yet.</p>
  }

  const W = 300
  const ROW_H = 28
  const LABEL_W = 90
  const COUNT_W = 30
  const BAR_AREA = W - LABEL_W - COUNT_W - 8
  const H = data.length * ROW_H + 8
  const maxVal = Math.max(...data.map((d) => d.count), 1)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      aria-label="Platform breakdown bar chart"
      role="img"
    >
      {data.map((d, i) => {
        const barW = (d.count / maxVal) * BAR_AREA
        const y = i * ROW_H + 4
        const color = PLATFORM_COLORS[i % PLATFORM_COLORS.length]

        return (
          <g key={d.platform}>
            <text
              x={0} y={y + ROW_H / 2 + 4}
              fontSize={11} fill="currentColor" fillOpacity={0.8}
            >
              {d.platform.length > 11
                ? d.platform.slice(0, 10) + "…"
                : d.platform}
            </text>
            {/* track */}
            <rect
              x={LABEL_W} y={y + 6}
              width={BAR_AREA} height={ROW_H - 12}
              fill="currentColor" fillOpacity={0.07} rx={3}
            />
            {/* bar */}
            <rect
              x={LABEL_W} y={y + 6}
              width={barW} height={ROW_H - 12}
              fill={color} rx={3}
            />
            <text
              x={LABEL_W + BAR_AREA + 6}
              y={y + ROW_H / 2 + 4}
              fontSize={11} fill="currentColor" fillOpacity={0.7}
            >
              {d.count}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Circular progress (SVG stroke-dasharray) for response rate
function CircularProgress({ pct }: { pct: number }) {
  const R = 52
  const CX = 60
  const CY = 60
  const CIRCUMFERENCE = 2 * Math.PI * R
  const dash = (pct / 100) * CIRCUMFERENCE

  return (
    <svg
      viewBox="0 0 120 120"
      width={120}
      height={120}
      aria-label={`Response rate ${pct}%`}
      role="img"
    >
      {/* track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={10}
      />
      {/* progress */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#22c55e"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      {/* label */}
      <text
        x={CX} y={CY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={700}
        fill="currentColor"
      >
        {pct}%
      </text>
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialData?: ReviewAnalyticsData | null
}

export function ReviewAnalyticsClient({ initialData }: Props) {
  const [data, setData] = useState<ReviewAnalyticsData | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) return
    async function load() {
      try {
        const res = await fetch("/api/review-analytics")
        if (!res.ok) throw new Error("Failed to fetch analytics")
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [initialData])

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">
          Loading analytics…
        </span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="text-sm text-muted-foreground">
        {error ?? "No analytics data available."}
      </p>
    )
  }

  const totalDrafts = data.totalDrafts ?? 0
  const statusDistribution = data.statusDistribution ?? {}

  return (
    <div className="space-y-6">
      {/* ── Existing Stats Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatsCard
          title="Total Drafts"
          value={totalDrafts}
          icon={FileText}
          description="All review drafts"
        />
        <StatsCard
          title="Available"
          value={data.available ?? 0}
          icon={CheckCircle}
          description="Ready to assign"
        />
        <StatsCard
          title="Allocated"
          value={data.allocated ?? 0}
          icon={UserPlus}
          description="Assigned to team"
        />
        <StatsCard
          title="Shared"
          value={data.shared ?? 0}
          icon={Share2}
          description="Shared with customer"
        />
        <StatsCard
          title="Posted"
          value={data.used ?? 0}
          icon={Upload}
          description="Posted & used"
        />
        <StatsCard
          title="Archived"
          value={statusDistribution.Archived ?? 0}
          icon={Archive}
          description="Archived drafts"
        />
      </div>

      {/* ── Existing Cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team-wise Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {(data.teamUsage ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.teamUsage.map(({ name, count }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">{count} used</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform-wise Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {(data.platformUsage ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.platformUsage.map(({ platform, count }) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="font-medium">{platform}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(statusDistribution).map(([status, count]) => {
              const total = totalDrafts || 1
              const pct = Math.round((Number(count) / total) * 100)
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{status}</span>
                    <span>
                      {Number(count)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Posted Trend (Last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {(data.dailyTrend ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No posted reviews yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dailyTrend.map(({ date, count }) => (
                    <tr key={date} className="border-b last:border-0">
                      <td className="py-2">
                        {new Date(date).toLocaleDateString()}
                      </td>
                      <td className="text-right py-2">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── New Section 1: Monthly Trends ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyTrendsChart data={data.monthlyTrends ?? []} />
          {/* Legend */}
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-4 rounded-sm bg-blue-500" />
              Drafted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-4 rounded-sm bg-green-500" />
              Used
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── New Section 2: Platform Breakdown ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <PlatformHorizontalBars data={data.platformBreakdown ?? []} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ── New Section 3: Top Reviewers ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Top Reviewers</CardTitle>
          </CardHeader>
          <CardContent>
            {(data.topReviewers ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ol className="space-y-2">
                {data.topReviewers.map((r, idx) => (
                  <li key={r.name} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium truncate">{r.name}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {r.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* ── New Section 4: Response Rate ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Response Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-2">
            <CircularProgress pct={data.responseRate ?? 0} />
            <p className="text-center text-sm text-muted-foreground">
              {data.responseRate ?? 0}% of drafts have been posted
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
