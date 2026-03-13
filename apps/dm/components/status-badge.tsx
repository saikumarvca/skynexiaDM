import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: 'UNUSED' | 'USED' | 'ARCHIVED' | 'ACTIVE' | 'INACTIVE'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    UNUSED: "bg-green-100 text-green-800 hover:bg-green-100",
    USED: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    ARCHIVED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    ACTIVE: "bg-green-100 text-green-800 hover:bg-green-100",
    INACTIVE: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  }

  return (
    <Badge
      variant="secondary"
      className={cn(variants[status], className)}
    >
      {status}
    </Badge>
  )
}