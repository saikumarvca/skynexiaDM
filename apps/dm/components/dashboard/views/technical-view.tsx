import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollText, Webhook, ArrowRight } from "lucide-react"
import type { DashboardTechnicalCounts, DashboardTechnicalSnapshot } from "@/types"

const COUNT_LABELS: { key: keyof DashboardTechnicalCounts; label: string }[] = [
  { key: "clients", label: "Clients" },
  { key: "reviews", label: "Reviews" },
  { key: "leads", label: "Leads" },
  { key: "campaigns", label: "Campaigns" },
  { key: "tasks", label: "Tasks" },
  { key: "scheduledPosts", label: "Scheduled posts" },
  { key: "webhooks", label: "Webhooks" },
  { key: "teamMembers", label: "Team members" },
  { key: "users", label: "Login users" },
  { key: "notifications", label: "Notifications" },
  { key: "contentItems", label: "Content items" },
  { key: "keywords", label: "SEO keywords" },
  { key: "reviewDrafts", label: "Review drafts" },
  { key: "reviewAllocations", label: "Review allocations" },
  { key: "reviewRequests", label: "Review requests" },
]

export function TechnicalView({ technical }: { technical: DashboardTechnicalSnapshot }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Environment</CardTitle>
            <CardDescription>Build &amp; runtime (non-sensitive)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm">
            <div className="flex justify-between gap-4 border-b border-border/50 py-1.5">
              <span className="text-muted-foreground">App version</span>
              <span className="tabular-nums">{technical.appVersion}</span>
            </div>
            <div className="flex justify-between gap-4 py-1.5">
              <span className="text-muted-foreground">NODE_ENV</span>
              <span className="tabular-nums">{technical.nodeEnv}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Admin shortcuts</CardTitle>
            <CardDescription>Operational tools</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/webhooks">
                <Webhook className="mr-1.5 h-3.5 w-3.5" />
                Webhooks
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/audit-log">
                <ScrollText className="mr-1.5 h-3.5 w-3.5" />
                Audit log
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/users">
                Users
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Collection counts</CardTitle>
          <CardDescription>
            Raw document totals across major models (includes archived where applicable).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Collection</th>
                <th className="pb-2 text-right font-mono font-medium">Documents</th>
              </tr>
            </thead>
            <tbody>
              {COUNT_LABELS.map(({ key, label }) => (
                <tr key={key} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4">{label}</td>
                  <td className="py-2 text-right font-mono tabular-nums">
                    {technical.counts[key] ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  )
}
