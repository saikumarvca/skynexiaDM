"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type DonutSlice = {
  key: string;
  label: string;
  count: number;
  pct: number;
  color: string;
};

const SIZE = 180;
const R = 74;
const STROKE = 26;

function arc(cx: number, cy: number, r: number, start: number, end: number) {
  const a0 = ((start - 90) * Math.PI) / 180;
  const a1 = ((end - 90) * Math.PI) / 180;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = end - start > 180 ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}

/**
 * Donut with the total in the centre and a legend listing count and share.
 * The legend sits beside the donut when the container is wide enough for a
 * full row (label, count, share) and wraps below it otherwise, so it never
 * overflows a narrow card.
 */
export function DonutChart({
  slices,
  total,
  centerLabel = "Total Reviews",
  className,
}: {
  slices: DonutSlice[];
  total: number;
  centerLabel?: string;
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const arcs: (DonutSlice & { start: number; end: number })[] = [];
  for (const s of slices) {
    if (s.count <= 0) continue;
    const span = total > 0 ? (s.count / total) * 360 : 0;
    const start = arcs.length > 0 ? arcs[arcs.length - 1]!.end : 0;
    arcs.push({ ...s, start, end: start + span });
  }
  const activeSlice = slices.find((s) => s.key === active) ?? null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-6 gap-y-5", className)}>
      <div className="relative shrink-0">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`${centerLabel}: ${total}`}
          onPointerLeave={() => setActive(null)}
        >
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth={STROKE} />
          ) : (
            arcs.map((a) => (
              <path
                key={a.key}
                d={a.end - a.start >= 359.99 ? `M${cx},${cy - R} A${R},${R} 0 1 1 ${cx - 0.01},${cy - R}` : arc(cx, cy, R, a.start, a.end)}
                fill="none"
                stroke={a.color}
                strokeWidth={active === a.key ? STROKE + 4 : STROKE}
                strokeLinecap="butt"
                className="transition-[stroke-width] duration-150"
                onPointerEnter={() => setActive(a.key)}
              />
            ))
          )}
          {/* 2px surface gaps between slices */}
          {arcs.length > 1
            ? arcs.map((a) => {
                const rad = ((a.start - 90) * Math.PI) / 180;
                return (
                  <line
                    key={`gap-${a.key}`}
                    x1={cx + (R - STROKE / 2 - 3) * Math.cos(rad)}
                    y1={cy + (R - STROKE / 2 - 3) * Math.sin(rad)}
                    x2={cx + (R + STROKE / 2 + 3) * Math.cos(rad)}
                    y2={cy + (R + STROKE / 2 + 3) * Math.sin(rad)}
                    stroke="hsl(var(--card))"
                    strokeWidth="2"
                  />
                );
              })
            : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tabular-nums leading-none">
            {activeSlice ? activeSlice.count : total}
          </span>
          <span className="mt-1 max-w-[100px] text-[11px] leading-tight text-muted-foreground">
            {activeSlice ? `${activeSlice.label} · ${activeSlice.pct}%` : centerLabel}
          </span>
        </div>
      </div>
      <ul className="min-w-0 grow basis-[200px] space-y-2.5 text-sm">
        {slices.map((s) => (
          <li
            key={s.key}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-1 transition-colors",
              active === s.key && "bg-muted/60",
            )}
            onPointerEnter={() => setActive(s.key)}
            onPointerLeave={() => setActive(null)}
          >
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.label}
            </span>
            <span className="shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{s.count}</span> ({s.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
