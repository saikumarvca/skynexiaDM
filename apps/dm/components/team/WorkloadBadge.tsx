"use client";

import { Badge } from "@/components/ui/badge";
import type { WorkloadStatus } from "@/types/team";
import { cn } from "@/lib/utils";

const statusClasses: Record<WorkloadStatus, string> = {
  Available:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Balanced: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Busy: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Overloaded: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function WorkloadBadge({ status }: { status: WorkloadStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", statusClasses[status])}
    >
      {status}
    </Badge>
  );
}
