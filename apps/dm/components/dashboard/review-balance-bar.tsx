import { PieChart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ReviewBalanceBar({
  unused,
  used,
  total,
}: {
  unused: number
  used: number
  total: number
}) {
  const safeTotal = total > 0 ? total : 1
  const unusedPct = Math.round((unused / safeTotal) * 1000) / 10
  const usedPct = Math.round((used / safeTotal) * 1000) / 10

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <PieChart className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-base">Review balance</CardTitle>
            <CardDescription>Unused vs used across your library</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Add reviews to a client to see this breakdown.
          </p>
        ) : (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {unused > 0 && (
                <div
                  className="bg-emerald-500/90 transition-all duration-500 dark:bg-emerald-500/80"
                  style={{ width: `${unusedPct}%` }}
                  title={`${unused} unused (${unusedPct}%)`}
                />
              )}
              {used > 0 && (
                <div
                  className="bg-violet-500/85 transition-all duration-500 dark:bg-violet-500/75"
                  style={{ width: `${usedPct}%` }}
                  title={`${used} used (${usedPct}%)`}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span className="text-muted-foreground">Unused</span>
                <span className="font-semibold tabular-nums text-foreground">{unused}</span>
                <span className="text-muted-foreground">({unusedPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                <span className="text-muted-foreground">Used</span>
                <span className="font-semibold tabular-nums text-foreground">{used}</span>
                <span className="text-muted-foreground">({usedPct}%)</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
