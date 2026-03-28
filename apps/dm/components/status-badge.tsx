import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ClientReviewStatus = 'UNUSED' | 'USED' | 'ARCHIVED' | 'ACTIVE' | 'INACTIVE'
type CampaignStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED'
type DraftStatus = 'Available' | 'Allocated' | 'Shared' | 'Used' | 'Archived'
type AllocationStatus =
  | 'Unassigned'
  | 'Assigned'
  | 'Shared with Customer'
  | 'Posted'
  | 'Used'
  | 'Cancelled'

interface StatusBadgeProps {
  status: ClientReviewStatus | CampaignStatus | DraftStatus | AllocationStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<string, string> = {
    UNUSED: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    USED: "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
    ARCHIVED: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
    ACTIVE: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    INACTIVE: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
    PLANNED: "bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
    PAUSED: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    COMPLETED: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    CANCELLED: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    Available: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    Allocated: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    Shared: "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    Posted: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    Unassigned: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
    Assigned: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    "Shared with Customer": "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
  }

  return (
    <Badge
      variant="secondary"
      className={cn(variants[status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", className)}
    >
      {status}
    </Badge>
  )
}