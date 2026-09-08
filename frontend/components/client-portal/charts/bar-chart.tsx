"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type Bar = { key: string; label: string; value: number; color: string; hint?: string };

/** Vertical bars (e.g. reviews by rating) with direct value labels. */
export function VerticalBars({
  bars,
  className,
  ariaLabel = "Bar chart",
}: {
  bars: Bar[];
  className?: string;
  ariaLabel?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const W = 420;
  const H = 200;
  const PAD = { top: 22, right: 8, bottom: 26, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const slot = chartW / Math.max(1, bars.length);
  const barW = Math.min(44, slot * 0.55);

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + chartH}
          y2={PAD.top + chartH}
          stroke="hsl(var(--border))"
        />
        {bars.map((b, i) => {
          const h = (b.value / max) * chartH;
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const y = PAD.top + chartH - h;
          const isActive = active === b.key;
          return (
            <g
              key={b.key}
              onPointerEnter={() => setActive(b.key)}
              onPointerLeave={() => setActive(null)}
            >
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={chartH} fill="transparent" />
              {b.value > 0 ? (
                <path
                  d={`M${x},${PAD.top + chartH} v${-Math.max(0, h - 4)} a4,4 0 0 1 4,-4 h${barW - 8} a4,4 0 0 1 4,4 v${Math.max(0, h - 4)} z`}
                  fill={b.color}
                  opacity={active && !isActive ? 0.55 : 1}
                  className="transition-opacity"
                />
              ) : (
                <rect x={x} y={PAD.top + chartH - 2} width={barW} height={2} fill="hsl(var(--border))" />
              )}
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="12"
                fontWeight={600}
                fill="hsl(var(--foreground))"
              >
                {b.value}
              </text>
              <text
                x={x + barW / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill="hsl(var(--muted-foreground))"
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
      {active ? (
        <div className="pointer-events-none absolute right-2 top-0 rounded-md border bg-popover px-2 py-1 text-xs shadow-sm">
          {bars.find((b) => b.key === active)?.hint ??
            `${bars.find((b) => b.key === active)?.label}: ${bars.find((b) => b.key === active)?.value}`}
        </div>
      ) : null}
    </div>
  );
}

/** Horizontal bars (e.g. platform breakdown) with the value at the end. */
export function HorizontalBars({
  bars,
  className,
  ariaLabel = "Bar chart",
}: {
  bars: Bar[];
  className?: string;
  ariaLabel?: string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  if (bars.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>;
  }
  return (
    <ul className={cn("space-y-3", className)} aria-label={ariaLabel}>
      {bars.map((b) => (
        <li key={b.key} title={b.hint}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} aria-hidden />
              {b.label}
            </span>
            <span className="tabular-nums text-muted-foreground">{b.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${Math.max(2, Math.round((b.value / max) * 100))}%`, background: b.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
