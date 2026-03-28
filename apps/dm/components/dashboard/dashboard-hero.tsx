import { Sparkles } from "lucide-react"

function firstName(displayName: string) {
  const t = displayName.trim()
  if (!t) return "there"
  return t.split(/\s+/)[0] ?? "there"
}

export function DashboardHero({ userName }: { userName: string }) {
  const name = firstName(userName)
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card px-6 py-8 shadow-sm sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_-20%,hsl(var(--primary)/0.18),transparent),radial-gradient(ellipse_60%_50%_at_100%_0%,hsl(var(--accent)/0.35),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23000' stroke-opacity='0.06'%3E%3Cpath d='M0 40h80M40 0v80'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Overview
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {name}
          </h1>
          <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
            Track clients, reviews, and campaigns from one place. Here is what is happening across your
            workspace today.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
          <span className="block text-xs font-medium uppercase tracking-wide text-foreground/80">
            Today
          </span>
          <span className="font-medium text-foreground">{today}</span>
        </div>
      </div>
    </div>
  )
}
