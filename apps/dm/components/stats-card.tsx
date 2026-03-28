import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

const accentStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/15 text-primary",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
} as const

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  /** Visual accent for the icon tile; defaults to muted. */
  accent?: keyof typeof accentStyles
  className?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  accent = "default",
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/80 transition-shadow duration-300 hover:shadow-md",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.06] blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-70"
        aria-hidden
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100",
            accentStyles[accent]
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}