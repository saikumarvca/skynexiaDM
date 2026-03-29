"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ─── Types ──────────────────────────────────────────────────────────────────

interface BarDatum {
  label: string
  value: number
  color: string
}

interface MonthlyDatum {
  month: string
  count: number
}

interface ClientAnalytics {
  summary: {
    totalReviews: number
    unusedReviews: number
    usedReviews: number
    archivedReviews: number
    totalUsage: number
  }
  campaignsByStatus?: { status: string; count: number }[]
  leadsByStatus?: { status: string; count: number }[]
  monthlyReviewUsage?: MonthlyDatum[]
}

// ─── SVG Bar Chart (vertical) ────────────────────────────────────────────────

function VerticalBarChart({ data }: { data: BarDatum[] }) {
  const W = 300
  const H = 160
  const PAD = { top: 16, right: 16, bottom: 40, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const barWidth = chartW / data.length
  const barPad = barWidth * 0.2

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      aria-label="Vertical bar chart"
      role="img"
      style={{ overflow: "visible" }}
    >
      {/* Y-axis line */}
      <line
        x1={PAD.left}
        y1={PAD.top}
        x2={PAD.left}
        y2={PAD.top + chartH}
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth={1}
      />
      {/* X-axis line */}
      <line
        x1={PAD.left}
        y1={PAD.top + chartH}
        x2={PAD.left + chartW}
        y2={PAD.top + chartH}
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth={1}
      />

      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH
        const x = PAD.left + i * barWidth + barPad / 2
        const y = PAD.top + chartH - barH
        const w = barWidth - barPad

        return (
          <g key={d.label}>
            <rect x={x} y={y} width={w} height={barH} fill={d.color} rx={2} />
            {/* count label above bar */}
            <text
              x={x + w / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.8}
            >
              {d.value}
            </text>
            {/* x-axis label */}
            <text
              x={x + w / 2}
              y={PAD.top + chartH + 14}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.7}
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── SVG Horizontal Bar Chart ────────────────────────────────────────────────

function HorizontalBarChart({ data }: { data: BarDatum[] }) {
  const W = 300
  const ROW_H = 28
  const LABEL_W = 90
  const COUNT_W = 28
  const BAR_AREA = W - LABEL_W - COUNT_W - 8
  const H = data.length * ROW_H + 8

  const maxVal = Math.max(...data.map((d) => d.value), 1)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      aria-label="Horizontal bar chart"
      role="img"
    >
      {data.map((d, i) => {
        const barW = (d.value / maxVal) * BAR_AREA
        const y = i * ROW_H + 4

        return (
          <g key={d.label}>
            {/* label */}
            <text
              x={0}
              y={y + ROW_H / 2 + 4}
              fontSize={11}
              fill="currentColor"
              fillOpacity={0.8}
            >
              {d.label}
            </text>
            {/* track */}
            <rect
              x={LABEL_W}
              y={y + 6}
              width={BAR_AREA}
              height={ROW_H - 12}
              fill="currentColor"
              fillOpacity={0.07}
              rx={3}
            />
            {/* bar */}
            <rect
              x={LABEL_W}
              y={y + 6}
              width={barW}
              height={ROW_H - 12}
              fill={d.color}
              rx={3}
            />
            {/* count */}
            <text
              x={LABEL_W + BAR_AREA + 6}
              y={y + ROW_H / 2 + 4}
              fontSize={11}
              fill="currentColor"
              fillOpacity={0.7}
            >
              {d.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── SVG Sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, labels }: { data: number[]; labels: string[] }) {
  const W = 300
  const H = 80
  const PAD = { top: 12, right: 16, bottom: 24, left: 28 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data, 1)
  const n = data.length

  const points = data.map((v, i) => {
    const x = PAD.left + (i / Math.max(n - 1, 1)) * chartW
    const y = PAD.top + chartH - (v / maxVal) * chartH
    return `${x},${y}`
  })

  const dotPoints = data.map((v, i) => ({
    x: PAD.left + (i / Math.max(n - 1, 1)) * chartW,
    y: PAD.top + chartH - (v / maxVal) * chartH,
    v,
  }))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      aria-label="Sparkline chart"
      role="img"
      style={{ overflow: "visible" }}
    >
      {/* baseline */}
      <line
        x1={PAD.left}
        y1={PAD.top + chartH}
        x2={PAD.left + chartW}
        y2={PAD.top + chartH}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={1}
      />

      {/* line */}
      {n > 1 && (
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* dots + labels */}
      {dotPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#6366f1" />
          <text
            x={p.x}
            y={PAD.top + chartH + 14}
            textAnchor="middle"
            fontSize={9}
            fill="currentColor"
            fillOpacity={0.6}
          >
            {labels[i] ?? ""}
          </text>
        </g>
      ))}

      {/* Y max label */}
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

// ─── Campaign Status Badges ───────────────────────────────────────────────────

const CAMPAIGN_COLORS: Record<string, string> = {
  PLANNED: "#3b82f6",
  ACTIVE: "#22c55e",
  PAUSED: "#f59e0b",
  COMPLETED: "#14b8a6",
  CANCELLED: "#9ca3af",
  ARCHIVED: "#6b7280",
}

function CampaignStatusBadges({
  data,
}: {
  data: { status: string; count: number }[]
}) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No campaign data yet.</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {data.map((d) => {
        const color = CAMPAIGN_COLORS[d.status] ?? "#9ca3af"
        return (
          <div
            key={d.status}
            className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
            style={{
              backgroundColor: `${color}22`,
              border: `1px solid ${color}55`,
              color,
            }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {d.status}
            <span
              className="ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold"
              style={{ backgroundColor: color, color: "#fff" }}
            >
              {d.count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Lead Status Colors ───────────────────────────────────────────────────────

const LEAD_COLORS: Record<string, string> = {
  NEW: "#6366f1",
  CONTACTED: "#3b82f6",
  QUALIFIED: "#f59e0b",
  CLOSED_WON: "#22c55e",
  CLOSED_LOST: "#ef4444",
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  clientId: string
}

export function ClientPerformanceCharts({ clientId }: Props) {
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clients/${clientId}/analytics`)
        if (!res.ok) throw new Error("Failed to fetch analytics")
        const data = await res.json()
        setAnalytics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((n) => (
          <Card key={n}>
            <CardContent className="flex h-48 items-center justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">
                Loading chart…
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <p className="text-sm text-muted-foreground">
        {error ?? "No analytics data available."}
      </p>
    )
  }

  // Chart 1 — Reviews by Status
  const reviewStatusData: BarDatum[] = [
    { label: "UNUSED", value: analytics.summary.unusedReviews, color: "#3b82f6" },
    { label: "USED", value: analytics.summary.usedReviews, color: "#22c55e" },
    { label: "ARCHIVED", value: analytics.summary.archivedReviews, color: "#9ca3af" },
  ]

  // Chart 2 — Leads by Status
  const LEAD_ORDER = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED_WON", "CLOSED_LOST"]
  const leadMap = Object.fromEntries(
    (analytics.leadsByStatus ?? []).map((l) => [l.status, l.count])
  )
  const leadsData: BarDatum[] = LEAD_ORDER.map((s) => ({
    label: s.replace("_", " "),
    value: leadMap[s] ?? 0,
    color: LEAD_COLORS[s] ?? "#9ca3af",
  }))

  // Chart 4 — Monthly review usage sparkline
  const monthly = analytics.monthlyReviewUsage ?? []
  const sparkValues = monthly.map((m) => m.count)
  const sparkLabels = monthly.map((m) => {
    // e.g. "2025-03" → "Mar"
    const [, mo] = m.month.split("-")
    return new Date(2000, Number(mo) - 1, 1).toLocaleString("en", { month: "short" })
  })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Chart 1 — Reviews by Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Reviews by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VerticalBarChart data={reviewStatusData} />
          <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
            {reviewStatusData.map((d) => (
              <span key={d.label} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                {d.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart 2 — Leads by Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Leads by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {leadsData.every((d) => d.value === 0) ? (
            <p className="text-sm text-muted-foreground">No lead data yet.</p>
          ) : (
            <HorizontalBarChart data={leadsData} />
          )}
        </CardContent>
      </Card>

      {/* Chart 3 — Campaign Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Campaign Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignStatusBadges data={analytics.campaignsByStatus ?? []} />
        </CardContent>
      </Card>

      {/* Chart 4 — Monthly Review Usage Sparkline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Monthly Review Usage (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sparkValues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No monthly usage data yet.
            </p>
          ) : (
            <Sparkline data={sparkValues} labels={sparkLabels} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
