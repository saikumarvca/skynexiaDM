"use client";

import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ClientTrendPoint } from "@/lib/client-portal/dto";
import {
  SERIES_COLOR,
  SERIES_LABEL,
  formatAxisDate,
  type SeriesKey,
} from "@/components/client-portal/charts/chart-tokens";

const W = 720;
const H = 260;
const PAD = { top: 12, right: 16, bottom: 30, left: 36 };

function niceMax(v: number) {
  if (v <= 5) return 5;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

/**
 * Multi-series line chart with an area under the first series, a hover
 * crosshair and a tooltip. Colours come from the validated `--viz-*` tokens;
 * the legend is always present because there are >= 2 series.
 */
export function TrendChart({
  data,
  series,
  className,
  ariaLabel = "Review progress over time",
}: {
  data: ClientTrendPoint[];
  series: SeriesKey[];
  className?: string;
  ariaLabel?: string;
}) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const n = data.length;

  const maxVal = useMemo(
    () => niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => d[s])))),
    [data, series],
  );
  const x = (i: number) => PAD.left + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const y = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  const paths = useMemo(
    () =>
      series.map((s) => ({
        key: s,
        d: data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[s]).toFixed(1)}`).join(" "),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, series, maxVal],
  );

  const areaPath = useMemo(() => {
    if (n === 0) return "";
    const s = series[0]!;
    const top = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[s]).toFixed(1)}`).join(" ");
    return `${top} L${x(n - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, series, maxVal]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));
  const xTickIdx = useMemo(() => {
    if (n <= 6) return data.map((_, i) => i);
    const count = 5;
    return Array.from({ length: count }, (_, k) => Math.round((k / (count - 1)) * (n - 1)));
  }, [data, n]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * chartW;
    const i = n <= 1 ? 0 : Math.round((px / chartW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  if (n === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">No data for this period.</p>
    );
  }

  const hovered = hover != null ? data[hover] : null;
  const tooltipLeft = hover != null ? (x(hover) / W) * 100 : 0;

  return (
    <div className={cn("relative", className)} ref={wrapRef}>
      <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {series.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLOR[s] }} aria-hidden />
            {SERIES_LABEL[s]}
          </li>
        ))}
      </ul>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={ariaLabel}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLOR[series[0]!]} stopOpacity="0.18" />
            <stop offset="100%" stopColor={SERIES_COLOR[series[0]!]} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="hsl(var(--border))"
              strokeDasharray={t === 0 ? undefined : "3 4"}
            />
            <text
              x={PAD.left - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill="hsl(var(--muted-foreground))"
            >
              {t}
            </text>
          </g>
        ))}
        {xTickIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            fontSize="11"
            fill="hsl(var(--muted-foreground))"
          >
            {formatAxisDate(data[i]!.date)}
          </text>
        ))}
        <path d={areaPath} fill={`url(#${id}-area)`} />
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            stroke={SERIES_COLOR[p.key]}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {hover != null ? (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + chartH}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity="0.5"
              strokeDasharray="2 3"
            />
            {series.map((s) => (
              <circle
                key={s}
                cx={x(hover)}
                cy={y(data[hover]![s])}
                r="4.5"
                fill={SERIES_COLOR[s]}
                stroke="hsl(var(--card))"
                strokeWidth="2"
              />
            ))}
          </g>
        ) : null}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={chartW}
          height={chartH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
        />
      </svg>
      {hovered ? (
        <div
          className="pointer-events-none absolute top-8 z-10 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
          style={{ left: `${tooltipLeft}%` }}
        >
          <p className="mb-1 font-semibold">{formatAxisDate(hovered.date)}</p>
          {series.map((s) => (
            <p key={s} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLOR[s] }} aria-hidden />
                {SERIES_LABEL[s]}
              </span>
              <span className="font-semibold tabular-nums">{hovered[s]}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
