import Link from "next/link";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  CheckCircle,
  Archive,
  CalendarClock,
  ClipboardList,
  Inbox,
  FileEdit,
  ArrowRight,
  Activity,
} from "lucide-react";
import { DashboardRecentClients } from "@/components/dashboard-recent-clients";
import { ReviewBalanceBar } from "@/components/dashboard/review-balance-bar";
import { DashboardExplore } from "@/components/dashboard/dashboard-explore";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/types";

export type DashboardRecentClientRow = {
  _id: string;
  name: string;
  businessName: string;
  createdAt: string;
};

function AttentionTile({
  href,
  value,
  label,
  hint,
  icon: Icon,
  accentClass,
}: {
  href: string;
  value: number;
  label: string;
  hint: string;
  icon: typeof CalendarClock;
  accentClass: string;
}) {
  const isQuiet = value === 0;
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm transition-all duration-200",
        "hover:border-primary/35 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accentClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:group-hover:opacity-0"
          aria-hidden
        />
      </div>
      <p
        className={cn(
          "mt-3 text-3xl font-bold tabular-nums tracking-tight",
          isQuiet && "text-muted-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

export function OverviewView({
  data,
  recentClients,
}: {
  data: DashboardPageData;
  recentClients: DashboardRecentClientRow[];
}) {
  const reviewTotal = Math.max(1, data.totalReviews);
  const utilizationPct =
    Math.round((data.usedReviews / reviewTotal) * 1000) / 10;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total clients"
          value={data.totalClients}
          icon={Users}
          description="Active client accounts"
          accent="primary"
          href="/clients"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
        />
        <StatsCard
          title="Total reviews"
          value={data.totalReviews}
          icon={FileText}
          description="All reviews in the system"
          accent="sky"
          href="/dashboard/reviews"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:60ms]"
        />
        <StatsCard
          title="Unused reviews"
          value={data.unusedReviews}
          icon={CheckCircle}
          description="Ready to assign or publish"
          accent="emerald"
          href="/dashboard/reviews?status=UNUSED"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:120ms]"
        />
        <StatsCard
          title="Used reviews"
          value={data.usedReviews}
          icon={Archive}
          description="Already in the wild"
          accent="violet"
          href="/dashboard/reviews?status=USED"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:180ms]"
        />
      </div>

      {data.totalReviews > 0 && (
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          <span className="font-medium text-foreground">{utilizationPct}%</span>{" "}
          of your review library is marked used — {data.unusedReviews} still
          available to deploy.
        </p>
      )}

      <Card className="border-border/80 overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/25 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Activity className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-base">
                  Today &amp; attention
                </CardTitle>
                <p className="text-sm font-normal text-muted-foreground">
                  Live counts — open a list in one click
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <AttentionTile
            href="/dashboard/scheduled-posts"
            value={data.scheduledToday}
            label="Scheduled today"
            hint="Posts set to publish"
            icon={CalendarClock}
            accentClass="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
          />
          <AttentionTile
            href="/dashboard/tasks"
            value={data.openTasks}
            label="Open tasks"
            hint="Todo, in progress, or blocked"
            icon={ClipboardList}
            accentClass="bg-amber-500/15 text-amber-700 dark:text-amber-400"
          />
          <AttentionTile
            href="/dashboard/review-requests"
            value={data.reviewRequestsPending}
            label="Pending requests"
            hint="Awaiting your response"
            icon={Inbox}
            accentClass="bg-sky-500/15 text-sky-600 dark:text-sky-400"
          />
          <AttentionTile
            href="/dashboard/review-drafts"
            value={data.reviewDrafts}
            label="Review drafts"
            hint="In the drafting pipeline"
            icon={FileEdit}
            accentClass="bg-violet-500/15 text-violet-600 dark:text-violet-400"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/80 overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
              <CardTitle className="text-base">Shortcuts</CardTitle>
              <p className="text-sm font-normal text-muted-foreground">
                Jump into the areas you use most
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <DashboardExplore hideIntro />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <ReviewBalanceBar
            unused={data.unusedReviews}
            used={data.usedReviews}
            total={data.totalReviews}
          />
          <Card className="border-border/80 overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
              <CardTitle className="text-base">Latest clients</CardTitle>
              <p className="text-sm font-normal text-muted-foreground">
                Recently added to your roster
              </p>
            </CardHeader>
            <CardContent className="pt-5">
              <DashboardRecentClients clients={recentClients} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
