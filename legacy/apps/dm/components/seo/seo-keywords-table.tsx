"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  History,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RankHistoryChart } from "./rank-history-chart";
import { Keyword } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SeoKeywordsTableProps {
  keywords: Keyword[];
}

function getClientName(k: Keyword): string {
  const id = typeof k.clientId === "object" ? k.clientId : null;
  if (id && "businessName" in id)
    return (
      (id as { businessName?: string }).businessName ??
      (id as { name?: string }).name ??
      "—"
    );
  return "—";
}

function getClientId(k: Keyword): string {
  return typeof k.clientId === "object"
    ? (k.clientId as { _id: string })._id
    : (k.clientId as string);
}

export function SeoKeywordsTable({ keywords }: SeoKeywordsTableProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const visibleKeywords = showArchived
    ? keywords
    : keywords.filter((k) => k.status !== "ARCHIVED");

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this keyword?")) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error || "Failed to archive");
      }
      toast.success("Keyword archived");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to archive keyword",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUnarchive = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error || "Failed to unarchive");
      }
      toast.success("Keyword unarchived");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to unarchive keyword",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          id="show-archived-keywords"
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-input"
        />
        <label
          htmlFor="show-archived-keywords"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          Show archived keywords
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-medium">Keyword</th>
              <th className="pb-3 font-medium">Client</th>
              <th className="pb-3 font-medium">Rank</th>
              <th className="pb-3 font-medium">Search vol.</th>
              <th className="pb-3 font-medium">Difficulty</th>
              <th className="pb-3 font-medium">Target URL</th>
              <th className="pb-3 font-medium">Last updated</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visibleKeywords.map((k) => {
              const isExpanded = expandedId === k._id;
              const isArchived = k.status === "ARCHIVED";
              return (
                <Fragment key={k._id}>
                  <tr
                    className={`border-b last:border-0 ${isArchived ? "opacity-60" : ""}`}
                  >
                    <td className="py-3 font-medium">{k.keyword}</td>
                    <td className="py-3">
                      <Link
                        href={`/clients/${getClientId(k)}`}
                        className="text-primary hover:underline"
                      >
                        {getClientName(k)}
                      </Link>
                    </td>
                    <td className="py-3">
                      {k.rank != null ? (
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                          {k.rank}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3">
                      {k.searchVolume != null
                        ? k.searchVolume.toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3">
                      {k.difficulty != null ? (
                        <span
                          className={
                            k.difficulty >= 70
                              ? "text-red-600"
                              : k.difficulty >= 40
                                ? "text-amber-600"
                                : "text-green-600"
                          }
                        >
                          {k.difficulty}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className="max-w-[180px] truncate py-3 text-muted-foreground"
                      title={k.targetUrl}
                    >
                      {k.targetUrl ?? "—"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {k.lastUpdated
                        ? new Date(k.lastUpdated).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {!isArchived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleExpand(k._id)}
                            title="Show rank history"
                          >
                            <History className="h-3.5 w-3.5" />
                            {isExpanded ? (
                              <ChevronUp className="ml-1 h-3 w-3" />
                            ) : (
                              <ChevronDown className="ml-1 h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <Link
                          href={`/clients/${getClientId(k)}`}
                          className="text-muted-foreground hover:text-foreground"
                          title="Open client"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        {isArchived ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            disabled={updatingId === k._id}
                            onClick={() => handleUnarchive(k._id)}
                            title="Unarchive keyword"
                          >
                            Unarchive
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            disabled={updatingId === k._id}
                            onClick={() => handleArchive(k._id)}
                            title="Archive keyword"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b bg-muted/30">
                      <td colSpan={8} className="px-4 py-4">
                        <RankHistoryChart
                          keywordId={k._id}
                          keyword={k.keyword}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
