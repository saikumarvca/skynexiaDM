import type { ClientReviewStatus } from "@/lib/client-portal/dto";

/**
 * Chart colours resolve through CSS custom properties declared in
 * app/globals.css (`--viz-*`), so light and dark themes each use their own
 * validated steps.
 */
export const SERIES_COLOR = {
  total: "var(--viz-total)",
  posted: "var(--viz-posted)",
  shared: "var(--viz-shared)",
  inProgress: "var(--viz-progress)",
  drafts: "var(--viz-drafts)",
} as const;

export type SeriesKey = keyof typeof SERIES_COLOR;

export const SERIES_LABEL: Record<SeriesKey, string> = {
  total: "Total",
  posted: "Posted",
  shared: "Shared",
  inProgress: "In Progress",
  drafts: "Drafts",
};

export const STATUS_SERIES: Record<ClientReviewStatus, SeriesKey> = {
  POSTED: "posted",
  SHARED: "shared",
  IN_PROGRESS: "inProgress",
  DRAFT: "drafts",
};

/** Fixed order for platform bars (identity never re-coloured by rank). */
export const PLATFORM_COLOR: Record<string, string> = {
  google: "var(--viz-total)",
  facebook: "var(--viz-shared)",
  justdial: "var(--viz-progress)",
  website: "var(--viz-posted)",
};

export function platformColor(platform: string) {
  return PLATFORM_COLOR[platform.toLowerCase()] ?? "var(--viz-drafts)";
}

export function formatAxisDate(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
