import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLIENT_REVIEW_STATUS_LABEL,
  PORTAL_ACTOR_ROLE_LABEL,
  type ClientReviewStatus,
} from "@/lib/client-portal/dto";
import type { ClientEventActorRole } from "@/models/ClientEvent";
import { initials } from "@/components/client-portal/format";

/** Page title block used at the top of every portal page. */
export function PortalPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const STATUS_STYLES: Record<ClientReviewStatus, string> = {
  POSTED:
    "bg-emerald-500/12 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300 dark:ring-emerald-400/30",
  SHARED:
    "bg-violet-500/12 text-violet-700 ring-violet-600/20 dark:text-violet-300 dark:ring-violet-400/30",
  IN_PROGRESS:
    "bg-amber-500/14 text-amber-800 ring-amber-600/25 dark:text-amber-300 dark:ring-amber-400/30",
  DRAFT: "bg-slate-500/12 text-slate-700 ring-slate-500/20 dark:text-slate-300 dark:ring-slate-400/30",
};

export const STATUS_DOT: Record<ClientReviewStatus, string> = {
  POSTED: "var(--viz-posted)",
  SHARED: "var(--viz-shared)",
  IN_PROGRESS: "var(--viz-progress)",
  DRAFT: "var(--viz-drafts)",
};

export function StatusPill({
  status,
  className,
}: {
  status: ClientReviewStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_DOT[status] }}
        aria-hidden
      />
      {CLIENT_REVIEW_STATUS_LABEL[status]}
    </span>
  );
}

export function RatingStars({
  rating,
  size = 14,
  className,
}: {
  rating: number | null;
  size?: number;
  className?: string;
}) {
  if (rating == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating} out of 5 stars`}
      title={`${rating}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= rating ? "fill-amber-400 text-amber-400" : "text-border"}
          aria-hidden
        />
      ))}
    </span>
  );
}

const ROLE_STYLES: Record<ClientEventActorRole, string> = {
  ADMIN: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  DEVELOPER: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  AGENT: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  EMPLOYEE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  SYSTEM: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
};

export function RoleBadge({ role, className }: { role: ClientEventActorRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        ROLE_STYLES[role],
        className,
      )}
    >
      {PORTAL_ACTOR_ROLE_LABEL[role]}
    </span>
  );
}

export function ActorChip({
  name,
  role,
  compact = false,
}: {
  name: string | null;
  role: ClientEventActorRole;
  compact?: boolean;
}) {
  const display = name || PORTAL_ACTOR_ROLE_LABEL[role];
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary"
        aria-hidden
      >
        {role === "SYSTEM" && !name ? "SY" : initials(display)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium leading-tight">{display}</span>
        {!compact ? <RoleBadge role={role} className="mt-0.5" /> : null}
      </span>
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-card text-card-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-col gap-2 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-lg font-semibold leading-tight">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("px-5 pb-5", title || actions ? "pt-4" : "pt-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
