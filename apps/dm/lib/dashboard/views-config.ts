export const DASHBOARD_VIEWS_PUBLIC = ["overview", "operations", "content", "growth"] as const
export type DashboardPublicViewId = (typeof DASHBOARD_VIEWS_PUBLIC)[number]
export type DashboardViewId = DashboardPublicViewId | "technical"

const PUBLIC_SET = new Set<string>(DASHBOARD_VIEWS_PUBLIC)

export function parseDashboardViewParam(
  raw: string | null | undefined,
  isAdmin: boolean
): DashboardViewId {
  if (!raw || typeof raw !== "string") return "overview"
  const v = raw.trim().toLowerCase()
  if (v === "technical" && isAdmin) return "technical"
  if (PUBLIC_SET.has(v)) return v as DashboardViewId
  return "overview"
}

export function isSavedDashboardViewAllowed(raw: string, isAdmin: boolean): boolean {
  const v = raw.trim().toLowerCase()
  if (v === "technical") return isAdmin
  return PUBLIC_SET.has(v)
}

export const DASHBOARD_VIEW_STORAGE_KEY = "dm-dashboard-view"
