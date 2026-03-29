import Link from "next/link"
import {
  Archive,
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileEdit,
  UserPlus,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  {
    href: "/clients/new",
    title: "New client",
    description: "Onboard a business and set up their workspace",
    icon: UserPlus,
    className: "hover:border-primary/40 hover:bg-primary/[0.06]",
    iconClass: "bg-primary/15 text-primary",
  },
  {
    href: "/clients",
    title: "All clients",
    description: "Browse accounts, health, and quick links",
    icon: Users,
    className: "hover:border-sky-500/30 hover:bg-sky-500/[0.06]",
    iconClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  {
    href: "/dashboard/review-drafts",
    title: "Review drafts",
    description: "Shape and assign review copy before publishing",
    icon: FileEdit,
    className: "hover:border-violet-500/30 hover:bg-violet-500/[0.06]",
    iconClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    href: "/dashboard/analytics",
    title: "Analytics",
    description: "Spot trends and performance at a glance",
    icon: BarChart3,
    className: "hover:border-amber-500/35 hover:bg-amber-500/[0.06]",
    iconClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  {
    href: "/dashboard/tasks",
    title: "Tasks",
    description: "Stay on top of work across the team",
    icon: ClipboardList,
    className: "hover:border-emerald-500/30 hover:bg-emerald-500/[0.06]",
    iconClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/dashboard/scheduled-posts",
    title: "Scheduled posts",
    description: "Plan what goes out and when",
    icon: CalendarClock,
    className: "hover:border-cyan-500/30 hover:bg-cyan-500/[0.06]",
    iconClass: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  },
  {
    href: "/clients?archived=1",
    title: "Archived clients",
    description: "Restore or reference inactive accounts",
    icon: Archive,
    className: "hover:border-muted-foreground/30 hover:bg-muted/80",
    iconClass: "bg-muted text-muted-foreground",
  },
] as const

export function DashboardExplore({ hideIntro = false }: { hideIntro?: boolean }) {
  return (
    <div className="space-y-3">
      {!hideIntro ? (
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Explore</h2>
          <p className="text-sm text-muted-foreground">Jump into the areas you use most</p>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ href, title, description, icon: Icon, className, iconClass }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex gap-3 rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              className
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100",
                iconClass
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-foreground">{title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
