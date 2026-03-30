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
  ClipboardCheck,
  FileText,
  Mail,
  UserPlus,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { ReviewBalanceBar } from "@/components/dashboard/review-balance-bar";
import type { DashboardPageData } from "@/types";

export function ContentReviewsView({ data }: { data: DashboardPageData }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Review drafts"
          value={data.reviewDrafts}
          icon={ClipboardCheck}
          description="Bank of draft copy"
          accent="violet"
        />
        <StatsCard
          title="Allocations"
          value={data.reviewAllocations}
          icon={UserPlus}
          description="Assigned review slots"
          accent="sky"
        />
        <StatsCard
          title="Pending requests"
          value={data.reviewRequestsPending}
          icon={Mail}
          description="Review request emails"
          accent="amber"
        />
        <StatsCard
          title="Total reviews"
          value={data.totalReviews}
          icon={FileText}
          description="Unused + used (excl. archived)"
          accent="primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ReviewBalanceBar
            unused={data.unusedReviews}
            used={data.usedReviews}
            total={data.totalReviews}
          />
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">
                Content & review workflows
              </CardTitle>
              <CardDescription>Where to go next</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/review-drafts">
                  Drafts <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/review-allocations">
                  Allocations <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/review-templates">
                  Templates <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/review-analytics">
                  Review analytics <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/content">
                  Content bank <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card className="border-border/80 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Quick stats
            </CardTitle>
            <CardDescription>Library health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Unused reviews</span>
              <span className="font-mono font-medium tabular-nums">
                {data.unusedReviews}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Used reviews</span>
              <span className="font-mono font-medium tabular-nums">
                {data.usedReviews}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Scheduled posts today
              </span>
              <span className="font-mono font-medium tabular-nums">
                {data.scheduledToday}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
