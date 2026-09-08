import Link from "next/link";
import { ArrowRight, CheckCircle2, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientDashboardData } from "@/lib/client-portal/dto";

/** Plain-language summary of posting momentum for the selected range. */
export function ProgressHighlight({
  highlight,
  rangeLabel,
}: {
  highlight: ClientDashboardData["highlight"];
  rangeLabel: string;
}) {
  const { postedThisPeriod, postedPreviousPeriod, changePct } = highlight;
  let title = "Keep going";
  let text: string;
  let tone: "good" | "neutral" | "info" = "neutral";

  if (postedThisPeriod === 0 && postedPreviousPeriod === 0) {
    title = "Getting started";
    text = `No reviews were posted in ${rangeLabel.toLowerCase()} yet. Progress will show here as soon as reviews go live.`;
    tone = "info";
  } else if (changePct != null && changePct > 0) {
    title = "Great progress!";
    text = `You've received ${changePct}% more posted reviews in ${rangeLabel.toLowerCase()} compared to the previous period (${postedThisPeriod} vs ${postedPreviousPeriod}).`;
    tone = "good";
  } else if (changePct != null && changePct < 0) {
    title = "Slower period";
    text = `${postedThisPeriod} review${postedThisPeriod === 1 ? "" : "s"} posted in ${rangeLabel.toLowerCase()}, down from ${postedPreviousPeriod} in the previous period.`;
  } else if (changePct === 0) {
    title = "Steady pace";
    text = `${postedThisPeriod} review${postedThisPeriod === 1 ? "" : "s"} posted in ${rangeLabel.toLowerCase()}, the same as the previous period.`;
  } else {
    title = "Great progress!";
    text = `${postedThisPeriod} review${postedThisPeriod === 1 ? "" : "s"} posted in ${rangeLabel.toLowerCase()}; there were none in the previous period.`;
    tone = "good";
  }

  const Icon = tone === "good" ? CheckCircle2 : tone === "info" ? Info : Sparkles;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between",
        tone === "good"
          ? "border-emerald-500/30 bg-emerald-500/[0.07]"
          : "border-border/80 bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            tone === "good" ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p
            className={cn(
              "text-lg font-semibold leading-tight",
              tone === "good" && "text-emerald-700 dark:text-emerald-300",
            )}
          >
            {title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
      <Link
        href="/client/reviews?status=POSTED"
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium no-underline transition-colors",
          tone === "good"
            ? "border-emerald-600/40 bg-white text-emerald-700 hover:bg-emerald-50 dark:bg-transparent dark:text-emerald-300 dark:hover:bg-emerald-500/10"
            : "border-primary/40 text-primary hover:bg-primary/10",
        )}
      >
        View All Reviews
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
