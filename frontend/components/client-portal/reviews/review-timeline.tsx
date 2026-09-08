import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/components/client-portal/format";
import { RoleBadge } from "@/components/client-portal/ui/primitives";
import type { ClientReviewTimelineEvent } from "@/lib/client-portal/dto";

const STEPS: { step: ClientReviewTimelineEvent["step"]; label: string }[] = [
  { step: "CREATED", label: "Draft Created" },
  { step: "ASSIGNED", label: "Assigned" },
  { step: "SHARED", label: "Shared with Customer" },
  { step: "POSTED", label: "Posted" },
];

/** Vertical stepper: the four lifecycle stages plus any other client-visible activity. */
export function ReviewTimeline({ events }: { events: ClientReviewTimelineEvent[] }) {
  const byStep = new Map(events.filter((e) => e.step !== "ACTIVITY").map((e) => [e.step, e]));
  const extras = events.filter((e) => e.step === "ACTIVITY");
  const reachedIndex = STEPS.reduce((acc, s, i) => (byStep.has(s.step) ? i : acc), -1);

  return (
    <div className="space-y-6">
      <ol className="relative space-y-0">
        {STEPS.map((s, i) => {
          const ev = byStep.get(s.step);
          const done = !!ev;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={s.step} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[13px] top-7 h-[calc(100%-12px)] w-0.5",
                    i < reachedIndex ? "bg-emerald-500" : "bg-border",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                  done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={cn("font-semibold", !done && "text-muted-foreground")}>{s.label}</p>
                {ev ? (
                  <>
                    <p className="mt-0.5 text-sm text-muted-foreground">{ev.description}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="tabular-nums">{formatDateTime(ev.occurredAt)}</span>
                      {ev.actorName ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="font-medium text-foreground">{ev.actorName}</span>
                        </>
                      ) : null}
                      {ev.actorRole ? <RoleBadge role={ev.actorRole} /> : null}
                    </p>
                  </>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">Not reached yet</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {extras.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Other activity
          </p>
          <ol className="space-y-3 border-l pl-4">
            {extras.map((e) => (
              <li key={e.id} className="text-sm">
                <p className="font-medium">{e.title}</p>
                <p className="text-muted-foreground">{e.description}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">{formatDateTime(e.occurredAt)}</span>
                  {e.actorName ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="font-medium text-foreground">{e.actorName}</span>
                    </>
                  ) : null}
                  {e.actorRole ? <RoleBadge role={e.actorRole} /> : null}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
