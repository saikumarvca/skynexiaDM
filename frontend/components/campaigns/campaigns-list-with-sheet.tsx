"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Campaign, CampaignStatus, Client } from "@/types";
import { StatusBadge } from "@/components/status-badge";
import { CampaignForm } from "@/components/campaign-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExternalLink, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseFlexibleDateParam } from "@/lib/date-format";
import { cn } from "@/lib/utils";

const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
];

function clientDisplayName(c: Campaign) {
  const id = typeof c.clientId === "object" ? c.clientId : null;
  if (id && "businessName" in id) {
    return (
      (id as { businessName?: string }).businessName ??
      (id as { name?: string }).name ??
      "—"
    );
  }
  return "—";
}

function clientIdOf(c: Campaign) {
  return typeof c.clientId === "object"
    ? (c.clientId as { _id: string })._id
    : (c.clientId as string);
}

function buildUpdatePayload(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const campaignName = formData.get("campaignName") as string;
  const platform = formData.get("platform") as string;
  const budget = formData.get("budget");
  const startRaw = ((formData.get("startDate") as string) ?? "").trim();
  const endRaw = ((formData.get("endDate") as string) ?? "").trim();
  const startIsoDay = parseFlexibleDateParam(startRaw);
  const endIsoDay = parseFlexibleDateParam(endRaw);

  const metricNum = (name: string): number => {
    const v = formData.get(name);
    if (v === null || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    clientId,
    campaignName,
    platform,
    objective:
      ((formData.get("objective") as string) ?? "").trim() || undefined,
    budget: budget && String(budget).trim() !== "" ? Number(budget) : undefined,
    startDate: startIsoDay
      ? new Date(`${startIsoDay}T12:00:00.000Z`).toISOString()
      : undefined,
    endDate: endIsoDay
      ? new Date(`${endIsoDay}T12:00:00.000Z`).toISOString()
      : undefined,
    status: (formData.get("status") as string) || "PLANNED",
    notes: ((formData.get("notes") as string) ?? "").trim() || undefined,
    metrics: {
      impressions: metricNum("metricImpressions"),
      clicks: metricNum("metricClicks"),
      leads: metricNum("metricLeads"),
      ctr: metricNum("metricCtr"),
      conversions: metricNum("metricConversions"),
      costPerLead: metricNum("metricCostPerLead"),
      conversionRate: metricNum("metricConversionRate"),
    },
  };
}

interface CampaignsListWithSheetProps {
  campaigns: Campaign[];
  clients: Client[];
}

export function CampaignsListWithSheet({
  campaigns,
  clients,
}: CampaignsListWithSheetProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bulk selection state
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<CampaignStatus | "">("");
  const [bulkWorking, setBulkWorking] = useState(false);

  const allChecked =
    campaigns.length > 0 && checkedIds.size === campaigns.length;
  const someChecked = checkedIds.size > 0 && !allChecked;

  function toggleAll() {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(campaigns.map((c) => c._id)));
    }
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkUpdateStatus() {
    if (!bulkStatus) {
      toast.error("Please select a status");
      return;
    }
    setBulkWorking(true);
    try {
      const res = await fetch("/api/campaigns/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update-status",
          ids: Array.from(checkedIds),
          status: bulkStatus,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(
          typeof err.error === "string" ? err.error : "Bulk update failed",
        );
        return;
      }
      const data = await res.json();
      toast.success(
        `Updated ${data.updated} campaign${data.updated !== 1 ? "s" : ""}`,
      );
      setCheckedIds(new Set());
      setBulkStatus("");
      router.refresh();
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setBulkWorking(false);
    }
  }

  async function updateCampaign(formData: FormData) {
    if (!selected) return;
    setError(null);
    const prevStatus = selected.status;
    const body = buildUpdatePayload(formData);
    const res = await fetch(`/api/campaigns/${selected._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg =
        typeof err.error === "string" ? err.error : "Failed to save campaign";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (body.status === "COMPLETED" && prevStatus !== "COMPLETED") {
      toast.success("Campaign marked complete");
    } else {
      toast.success("Changes saved");
    }
    router.refresh();
    setSelected(null);
  }

  return (
    <>
      {/* Bulk action bar */}
      {checkedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border bg-muted/50 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {checkedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) =>
                setBulkStatus(e.target.value as CampaignStatus | "")
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              disabled={bulkWorking}
            >
              <option value="">Update status…</option>
              {CAMPAIGN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              disabled={!bulkStatus || bulkWorking}
              onClick={bulkUpdateStatus}
            >
              Apply
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={bulkWorking}
            onClick={() => setCheckedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 w-10 pl-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={toggleAll}
                  aria-label="Select all campaigns"
                  className="h-4 w-4 cursor-pointer rounded border-input"
                />
              </th>
              <th className="pb-3 font-medium w-8" aria-hidden />
              <th className="pb-3 font-medium">Campaign</th>
              <th className="pb-3 font-medium">Client</th>
              <th className="pb-3 font-medium">Platform</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Budget</th>
              <th className="pb-3 font-medium">Dates</th>
              <th className="pb-3 font-medium">Metrics</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr
                key={c._id}
                className={cn(
                  "border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors",
                  selected?._id === c._id && "bg-muted/40",
                  checkedIds.has(c._id) && "bg-primary/5",
                )}
                onClick={() => {
                  setError(null);
                  setSelected(c);
                }}
              >
                <td
                  className="py-3 pl-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOne(c._id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkedIds.has(c._id)}
                    onChange={() => toggleOne(c._id)}
                    aria-label={`Select ${c.campaignName}`}
                    className="h-4 w-4 cursor-pointer rounded border-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="py-3 text-muted-foreground" aria-hidden>
                  <PanelRight className="h-4 w-4" />
                </td>
                <td className="py-3 font-medium">{c.campaignName}</td>
                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/clients/${clientIdOf(c)}`}
                    className="text-primary hover:underline"
                  >
                    {clientDisplayName(c)}
                  </Link>
                </td>
                <td className="py-3">{c.platform}</td>
                <td className="py-3">
                  <StatusBadge status={c.status as CampaignStatus} />
                </td>
                <td className="py-3">
                  {c.budget != null
                    ? `$${Number(c.budget).toLocaleString()}`
                    : "—"}
                </td>
                <td className="py-3">
                  {c.startDate
                    ? new Date(c.startDate).toLocaleDateString()
                    : "—"}
                  {" → "}
                  {c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}
                </td>
                <td className="py-3">
                  {c.metrics && (
                    <span className="text-muted-foreground">
                      {c.metrics.impressions != null &&
                        `${(c.metrics.impressions / 1000).toFixed(1)}k imp`}
                      {c.metrics.clicks != null && ` · ${c.metrics.clicks} clk`}
                      {c.metrics.leads != null && ` · ${c.metrics.leads} leads`}
                      {!c.metrics?.impressions &&
                        !c.metrics?.clicks &&
                        !c.metrics?.leads &&
                        "—"}
                    </span>
                  )}
                </td>
                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/clients/${clientIdOf(c)}`}
                    className="text-muted-foreground hover:text-foreground inline-flex"
                    title="Open client"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setError(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-full flex-col gap-0 border-l p-0 sm:max-w-lg"
        >
          {selected && (
            <>
              <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
                <SheetTitle className="line-clamp-2 pr-2">
                  {selected.campaignName}
                </SheetTitle>
                <SheetDescription>
                  View and edit this campaign. To remove from active work, set
                  status to ARCHIVED and save.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {error && (
                  <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <CampaignForm
                  key={selected._id}
                  clients={clients}
                  action={updateCampaign}
                  initialCampaign={selected}
                  showCard={false}
                  showMetrics
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
