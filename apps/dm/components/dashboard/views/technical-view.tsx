"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Copy,
  Cpu,
  Database,
  FileStack,
  Globe,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  UserCog,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  DashboardTechnicalCounts,
  DashboardTechnicalSnapshot,
} from "@/types";

const KEY_LABEL: Record<keyof DashboardTechnicalCounts, string> = {
  clients: "Clients",
  reviews: "Reviews",
  leads: "Leads",
  campaigns: "Campaigns",
  tasks: "Tasks",
  scheduledPosts: "Scheduled posts",
  webhooks: "Webhooks",
  teamMembers: "Team members",
  users: "Login users",
  notifications: "Notifications",
  contentItems: "Content items",
  keywords: "SEO keywords",
  reviewDrafts: "Review drafts",
  reviewAllocations: "Review allocations",
  reviewRequests: "Review requests",
};

const DATA_GROUPS: {
  title: string;
  description: string;
  icon: typeof Database;
  keys: (keyof DashboardTechnicalCounts)[];
  accent: string;
}[] = [
  {
    title: "CRM & growth",
    description: "Clients, pipeline, and campaigns",
    icon: Building2,
    keys: ["clients", "leads", "campaigns"],
    accent: "from-sky-500/20 to-transparent",
  },
  {
    title: "Reviews",
    description: "Library, drafts, allocations, requests",
    icon: FileStack,
    keys: ["reviews", "reviewDrafts", "reviewAllocations", "reviewRequests"],
    accent: "from-violet-500/20 to-transparent",
  },
  {
    title: "Content & SEO",
    description: "Bank, keywords, publishing queue",
    icon: Sparkles,
    keys: ["contentItems", "keywords", "scheduledPosts"],
    accent: "from-emerald-500/20 to-transparent",
  },
  {
    title: "Operations & access",
    description: "Tasks, team, logins, hooks, alerts",
    icon: Zap,
    keys: ["tasks", "teamMembers", "users", "webhooks", "notifications"],
    accent: "from-amber-500/20 to-transparent",
  },
];

function formatGeneratedAt(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(d);
  } catch {
    return iso;
  }
}

function SegmentedMeter({
  segments,
  className,
}: {
  segments: { key: string; value: number; className: string }[];
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div
      className={cn(
        "flex h-2.5 overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      {segments.map((seg) =>
        seg.value > 0 ? (
          <div
            key={seg.key}
            className={cn("min-w-0 transition-all", seg.className)}
            style={{ width: `${(seg.value / total) * 100}%` }}
            title={`${seg.key}: ${seg.value}`}
          />
        ) : null,
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: typeof Activity;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.06] blur-2xl" />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}

function CollectionRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 1000) / 10 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-500 dark:bg-primary/60"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function TechnicalView({
  technical,
}: {
  technical: DashboardTechnicalSnapshot;
}) {
  const [query, setQuery] = useState("");

  const maxCount = useMemo(
    () => Math.max(1, ...Object.values(technical.counts)),
    [technical.counts],
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DATA_GROUPS;
    return DATA_GROUPS.map((g) => ({
      ...g,
      keys: g.keys.filter(
        (k) =>
          KEY_LABEL[k].toLowerCase().includes(q) ||
          k.toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q),
      ),
    })).filter((g) => g.keys.length > 0);
  }, [query]);

  const envBadge =
    technical.nodeEnv === "production" ? (
      <Badge className="font-mono text-[10px] uppercase tracking-wider">
        Production
      </Badge>
    ) : technical.nodeEnv === "development" ? (
      <Badge
        variant="secondary"
        className="font-mono text-[10px] uppercase tracking-wider"
      >
        Development
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="font-mono text-[10px] uppercase tracking-wider"
      >
        {technical.nodeEnv}
      </Badge>
    );

  async function copySnapshot() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(technical, null, 2));
      toast.success("Snapshot copied to clipboard");
    } catch {
      toast.error("Could not copy — check browser permissions");
    }
  }

  const { breakdown } = technical;

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] via-card to-cyan-500/[0.05] p-6 shadow-sm sm:p-8",
          "dark:from-violet-500/10 dark:via-card dark:to-cyan-500/10",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%238b5cf6' stroke-opacity='0.12'%3E%3Cpath d='M0 24h48M24 0v48'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              <Cpu className="h-3.5 w-3.5" aria-hidden />
              Administrator diagnostics
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Technical control plane
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Non-sensitive runtime metadata, MongoDB collection scale, and
              quick links for operating the platform. Nothing here includes
              secrets or connection strings.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {envBadge}
              <span className="text-xs text-muted-foreground">
                Snapshot:{" "}
                <time
                  dateTime={technical.generatedAt}
                  className="font-mono text-foreground/90"
                >
                  {formatGeneratedAt(technical.generatedAt)}
                </time>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <Button
              type="button"
              variant="secondary"
              className="gap-2 border border-border/80 bg-background/80 backdrop-blur-sm"
              onClick={() => void copySnapshot()}
            >
              <Copy className="h-4 w-4" />
              Copy JSON snapshot
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Indexed documents"
          value={technical.totalDocuments.toLocaleString()}
          hint="Sum of counts below"
          icon={Database}
        />
        <StatTile
          label="Webhooks enabled"
          value={breakdown.webhooksEnabled}
          hint={`${breakdown.webhooksDisabled} disabled`}
          icon={Webhook}
        />
        <StatTile
          label="Active logins"
          value={breakdown.usersActive}
          hint={`${breakdown.usersInactive} inactive accounts`}
          icon={UserCog}
        />
        <StatTile
          label="Active team"
          value={breakdown.teamActive}
          hint={`${breakdown.teamInactive} inactive members`}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Runtime
            </CardTitle>
            <CardDescription>
              Build identity &amp; public URL hint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                App version
              </p>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {technical.appVersion}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                NODE_ENV
              </p>
              <p className="font-mono text-sm">{technical.nodeEnv}</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Globe className="h-3 w-3" aria-hidden />
                NEXT_PUBLIC_APP_URL
              </p>
              {technical.publicAppUrl ? (
                <a
                  href={technical.publicAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-sm text-primary underline-offset-4 hover:underline"
                >
                  {technical.publicAppUrl}
                </a>
              ) : (
                <p className="font-mono text-sm text-muted-foreground">
                  Not set
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Operational mix
            </CardTitle>
            <CardDescription>
              How subscriptions and archives split across key models
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Webhooks</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {breakdown.webhooksEnabled} on · {breakdown.webhooksDisabled}{" "}
                  off
                </span>
              </div>
              <SegmentedMeter
                segments={[
                  {
                    key: "on",
                    value: breakdown.webhooksEnabled,
                    className: "bg-emerald-500/85 dark:bg-emerald-500/75",
                  },
                  {
                    key: "off",
                    value: breakdown.webhooksDisabled,
                    className: "bg-muted-foreground/25",
                  },
                ]}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Login users</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {breakdown.usersActive} active · {breakdown.usersInactive}{" "}
                  inactive
                </span>
              </div>
              <SegmentedMeter
                segments={[
                  {
                    key: "active",
                    value: breakdown.usersActive,
                    className: "bg-sky-500/85 dark:bg-sky-500/75",
                  },
                  {
                    key: "inactive",
                    value: breakdown.usersInactive,
                    className: "bg-muted-foreground/25",
                  },
                ]}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Team members</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {breakdown.teamActive} active · {breakdown.teamInactive}{" "}
                  inactive
                </span>
              </div>
              <SegmentedMeter
                segments={[
                  {
                    key: "tActive",
                    value: breakdown.teamActive,
                    className: "bg-violet-500/85 dark:bg-violet-500/75",
                  },
                  {
                    key: "tInactive",
                    value: breakdown.teamInactive,
                    className: "bg-muted-foreground/25",
                  },
                ]}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Archived records</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {breakdown.clientsArchived} clients ·{" "}
                  {breakdown.reviewsArchived} reviews
                </span>
              </div>
              <SegmentedMeter
                segments={[
                  {
                    key: "cArch",
                    value: breakdown.clientsArchived,
                    className: "bg-amber-500/80 dark:bg-amber-500/70",
                  },
                  {
                    key: "rArch",
                    value: breakdown.reviewsArchived,
                    className: "bg-orange-600/70 dark:bg-orange-600/60",
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Data plane</h3>
            <p className="text-sm text-muted-foreground">
              Collection scale by domain — bars are relative to the largest
              count on this page ({maxCount.toLocaleString()}).
            </p>
          </div>
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter collections…"
              className="pl-9"
              aria-label="Filter data plane collections"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredGroups.map((group) => {
            const Icon = group.icon;
            const groupMax = Math.max(
              1,
              ...group.keys.map((k) => technical.counts[k]),
            );
            return (
              <Card
                key={group.title}
                className="border-border/80 overflow-hidden bg-card shadow-sm"
              >
                <div
                  className={cn(
                    "h-1 w-full bg-gradient-to-r",
                    group.accent,
                    "via-primary/10 to-transparent",
                  )}
                />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4" />
                    </span>
                    {group.title}
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.keys.map((key) => (
                    <CollectionRow
                      key={key}
                      label={KEY_LABEL[key]}
                      value={technical.counts[key]}
                      max={groupMax}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredGroups.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No collections match that filter.
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold tracking-tight">
          Admin workspace
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/dashboard/admin/users",
              title: "Users & roles",
              desc: "Login accounts, activation, RBAC entry point",
              icon: UserCog,
            },
            {
              href: "/dashboard/admin/webhooks",
              title: "Webhooks",
              desc: "Outbound integrations and delivery health",
              icon: Webhook,
            },
            {
              href: "/dashboard/admin/audit-log",
              title: "Audit log",
              desc: "Immutable trail of sensitive actions",
              icon: ScrollText,
            },
            {
              href: "/dashboard/settings",
              title: "Settings",
              desc: "Profile, email, and app preferences",
              icon: Shield,
            },
            {
              href: "/team",
              title: "Team",
              desc: "Roster, roles, assignments, workload",
              icon: Users,
            },
            {
              href: "/dashboard/analytics",
              title: "Analytics",
              desc: "Campaigns, leads, and spend overview",
              icon: BarChart3,
            },
            {
              href: "/dashboard/notifications",
              title: "Notifications",
              desc: `In-app queue (${technical.counts.notifications.toLocaleString()} rows)`,
              icon: Bell,
            },
            {
              href: "/dashboard",
              title: "Overview dashboard",
              desc: "Switch back to the default executive view",
              icon: Sparkles,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all",
                "hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                  <item.icon className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 font-medium">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
