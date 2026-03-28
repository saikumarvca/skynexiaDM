'use client'

import { useEffect, useState } from 'react'

interface HistoryEntry {
  _id: string
  rank: number
  searchVolume?: number
  recordedAt: string
}

interface RankHistoryChartProps {
  keywordId: string
  keyword: string
}

const CHART_W = 420
const CHART_H = 160
const PAD = { top: 12, right: 16, bottom: 32, left: 36 }

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function RankHistoryChart({ keywordId, keyword }: RankHistoryChartProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/keywords/${keywordId}/history`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch history')
        return r.json()
      })
      .then((data: HistoryEntry[]) => {
        // API returns newest first; reverse for chart (oldest → newest left → right)
        setHistory([...data].reverse())
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [keywordId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        Loading history…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        Not enough history yet
      </div>
    )
  }

  const ranks = history.map((h) => h.rank)
  const minRank = Math.min(...ranks)
  const maxRank = Math.max(...ranks)
  // Add 1-unit padding so extreme points aren't clipped
  const rankRange = maxRank - minRank || 1

  const innerW = CHART_W - PAD.left - PAD.right
  const innerH = CHART_H - PAD.top - PAD.bottom

  // Map a rank value to a y coordinate. Lower rank (better) = higher on chart.
  const toY = (rank: number) =>
    PAD.top + ((rank - minRank) / rankRange) * innerH

  const toX = (i: number) =>
    PAD.left + (i / (history.length - 1)) * innerW

  const points = history.map((h, i) => ({ x: toX(i), y: toY(h.rank), ...h }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  // Y axis labels: top = minRank (best), bottom = maxRank (worst)
  const yLabels = [minRank, Math.round((minRank + maxRank) / 2), maxRank]

  // X axis: show at most 6 evenly-spaced date labels
  const xLabelIndices: number[] = []
  const step = Math.max(1, Math.floor((history.length - 1) / 5))
  for (let i = 0; i < history.length; i += step) xLabelIndices.push(i)
  if (xLabelIndices[xLabelIndices.length - 1] !== history.length - 1) {
    xLabelIndices.push(history.length - 1)
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">
        Rank history — <span className="text-foreground">{keyword}</span>
        <span className="ml-2 text-muted-foreground">(lower = better)</span>
      </p>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        style={{ maxHeight: CHART_H }}
        aria-label={`Rank history chart for ${keyword}`}
      >
        {/* Grid lines */}
        {yLabels.map((rank) => {
          const y = toY(rank)
          return (
            <g key={rank}>
              <line
                x1={PAD.left}
                y1={y}
                x2={CHART_W - PAD.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={1}
              />
              <text
                x={PAD.left - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="currentColor"
                opacity={0.5}
              >
                {rank}
              </text>
            </g>
          )
        })}

        {/* Line path */}
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="hsl(var(--primary))"
          >
            <title>
              {formatDate(p.recordedAt)}: rank {p.rank}
            </title>
          </circle>
        ))}

        {/* X axis date labels */}
        {xLabelIndices.map((i) => {
          const point = history[i]
          if (!point) return null
          return (
            <text
              key={i}
              x={toX(i)}
              y={CHART_H - 6}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              opacity={0.5}
            >
              {formatDate(point.recordedAt)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
