import Link from "next/link";
import { StatsCard } from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarClock,
  ClipboardList,
  Target,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { DashboardPageData } from "@/types";

export function OperationsView({ data }: { data: DashboardPageData }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Open tasks"
          value={data.openTasks}
          icon={ClipboardList}
          description="Todo, in progress, or blocked"
          accent="emerald"
        />
        <StatsCard
          title="Scheduled today"
          value={data.scheduledToday}
          icon={CalendarClock}
          description="Posts slated to publish"
          accent="sky"
        />
        <StatsCard
          title="Active campaigns"
          value={data.activeCampaigns}
          icon={Target}
          description={`of ${data.totalCampaigns} total`}
          accent="amber"
        />
        <StatsCard
          title="Total leads"
          value={data.totalLeads}
          icon={TrendingUp}
          description="Across all stages"
          accent="violet"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Execution shortcuts</CardTitle>
            <CardDescription>Common operational screens</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/tasks">
                Tasks <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/content/scheduled-posts">
                Scheduled posts <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/leads">
                Leads <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/campaigns">
                Campaigns <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/notifications">
                Notifications <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Capacity snapshot</CardTitle>
            <CardDescription>Clients and reviews in the system</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Clients</p>
              <p className="text-2xl font-semibold tabular-nums">
                {data.totalClients}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Reviews (non-archived)
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {data.totalReviews}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
