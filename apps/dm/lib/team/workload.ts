import type { WorkloadStatus } from "@/types/team";

export const WORKLOAD_THRESHOLDS = {
  Available: 2,
  Balanced: 5,
  Busy: 10,
} as const;

export function getWorkloadStatus(openCount: number): WorkloadStatus {
  if (openCount <= WORKLOAD_THRESHOLDS.Available) return "Available";
  if (openCount <= WORKLOAD_THRESHOLDS.Balanced) return "Balanced";
  if (openCount <= WORKLOAD_THRESHOLDS.Busy) return "Busy";
  return "Overloaded";
}

export function calculateOpenAssignments(
  assignments: { status: string; isDeleted?: boolean }[],
): number {
  return assignments.filter(
    (a) =>
      !a.isDeleted && (a.status === "Pending" || a.status === "In Progress"),
  ).length;
}

export function calculateUrgentCount(
  assignments: { priority: string; status: string; isDeleted?: boolean }[],
): number {
  return assignments.filter(
    (a) =>
      !a.isDeleted &&
      a.priority === "Urgent" &&
      a.status !== "Completed" &&
      a.status !== "Cancelled",
  ).length;
}

export function calculateDueSoonCount(
  assignments: {
    dueDate?: Date | string | null;
    status: string;
    isDeleted?: boolean;
  }[],
  withinDays = 7,
): number {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + withinDays);

  return assignments.filter((a) => {
    if (a.isDeleted || a.status === "Completed" || a.status === "Cancelled")
      return false;
    if (!a.dueDate) return false;
    const d = new Date(a.dueDate);
    return d >= now && d <= cutoff;
  }).length;
}
