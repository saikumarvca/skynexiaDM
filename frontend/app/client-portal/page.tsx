import Link from "next/link";
import {
  ClipboardList,
  ExternalLink,
  FileText,
  Share2,
  TrendingDown,
  TrendingUp,
  Minus,
  Upload,
} from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DailyProgressCard } from "@/components/review-analytics/daily-progress-card";
import { getCachedUser } from "@/lib/auth";
import { getClientReviewSummary, getPortalClient } from "@/lib/client-portal";
import {
  getReviewDailyProgress,
  normalizeDailyProgressRange,
} from "@/lib/reviews/daily-progress";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ClientPortalPage() {
  const user = await getCachedUser();
  const client = await getPortalClient(user.clientId);

  if (!client) {
    return (
      <Card className="mx-auto mt-10 max-w-lg">
        <CardHeader>
          <CardTitle>Your login is not linked to a client yet</CardTitle>
          <CardDescription>
            Please contact your agency so they can connect this account to your
            business.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const range = normalizeDailyProgressRange();
  const [summary, daily] = await Promise.all([
    getClientReviewSummary(client.id),
    getReviewDailyProgress({
      clientId: client.id,
      from: range.from,
      to: range.to,
      scope: { isAdmin: true, accountType: "MAIN_EMPLOYEE", assignedClientIds: [] },
    }),
  ]);
  // Team member names stay internal to the agency.
  const dailyForClient = { ...daily, memberId: null, members: [] };

  const delta = summary.postedLast7Days - summary.postedPrevious7Days;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor =
    delta > 0
      ? "text-green-600 dark:text-green-400"
      : delta < 0
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground";
  const platformMax = Math.max(1, ...summary.platforms.map((p) => p.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Review progress
          </h1>
          <p className="text-muted-foreground">
            {client.businessName}
            {client.brandName && client.brandName !== client.businessName
              ? ` · ${client.brandName}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <TrendIcon className={`h-4 w-4 ${trendColor}`} aria-hidden />
          <span className={trendColor}>
            {summary.postedLast7Days} posted in the last 7 days
          </span>
          <span className="text-muted-foreground">
            vs {summary.postedPrevious7Days} the week before
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Reviews prepared"
          value={summary.drafts}
          icon={FileText}
          description="Written for your business"
          accent="violet"
        />
        <StatsCard
          title="In progress"
          value={summary.inProgress}
          icon={ClipboardList}
          description="Being handled by the team"
          accent="amber"
        />
        <StatsCard
          title="Awaiting posting"
          value={summary.awaitingPosting}
          icon={Share2}
          description="Shared with customers"
          accent="sky"
        />
        <StatsCard
          title="Posted"
          value={summary.posted}
          icon={Upload}
          description="Live reviews"
          accent="emerald"
        />
      </div>

      <DailyProgressCard
        initialData={dailyForClient}
        lockedClient={{ id: client.id, name: client.businessName }}
        showMembers={false}
        title="Daily progress"
        description="Reviews shared with customers and posted each day for"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Posted by platform</CardTitle>
            <CardDescription>Where your reviews have gone live</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.platforms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reviews posted yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {summary.platforms.map((p) => (
                  <li key={p.platform}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{p.platform}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {p.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.round((p.count / platformMax) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recently posted reviews</CardTitle>
            <CardDescription>The latest 20 reviews that went live</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.recentPosted.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Posted reviews will appear here.
              </p>
            ) : (
              <div className="max-w-full overflow-x-auto rounded-lg border">
                <Table className="min-w-[560px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground">
                        Date
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Platform
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Posted by
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Review
                      </TableHead>
                      <TableHead className="w-[80px] text-right font-semibold text-foreground">
                        Link
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.recentPosted.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {formatDate(r.postedDate)}
                        </TableCell>
                        <TableCell>{r.platform || "—"}</TableCell>
                        <TableCell>{r.postedByName || "—"}</TableCell>
                        <TableCell
                          className="max-w-[260px] truncate text-muted-foreground"
                          title={r.subject}
                        >
                          {r.subject || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.reviewLink ? (
                            <Link
                              href={r.reviewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary"
                              aria-label="Open posted review"
                            >
                              Open
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
