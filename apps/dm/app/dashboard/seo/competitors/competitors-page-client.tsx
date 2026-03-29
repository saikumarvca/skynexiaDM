"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface Competitor {
  _id: string;
  name: string;
  domain: string;
  isActive: boolean;
}

interface RankGapKeyword {
  keyword: string;
  clientRank: number | null;
  bestCompetitorRank: number | null;
  gap: number | null;
  losing: boolean;
  competitors: { name: string; domain: string; rank: number | null }[];
}

export function CompetitorsPageClient() {
  const [clientId, setClientId] = useState("");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [rankGap, setRankGap] = useState<RankGapKeyword[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);

  async function loadCompetitors(cId: string) {
    if (!cId) return;
    const res = await fetch(`/api/competitors?clientId=${cId}`);
    if (res.ok) setCompetitors(await res.json());
  }

  async function loadRankGap(cId: string) {
    if (!cId) return;
    setGapLoading(true);
    const res = await fetch(`/api/seo/rank-gap?clientId=${cId}`);
    if (res.ok) {
      const data = await res.json();
      setRankGap(data.keywords ?? []);
    }
    setGapLoading(false);
  }

  async function addCompetitor() {
    if (!clientId || !newDomain || !newName) return;
    setLoading(true);
    const res = await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, domain: newDomain, name: newName }),
    });
    if (res.ok) {
      setNewDomain("");
      setNewName("");
      loadCompetitors(clientId);
    }
    setLoading(false);
  }

  async function deleteCompetitor(id: string) {
    await fetch(`/api/competitors/${id}`, { method: "DELETE" });
    setCompetitors((c) => c.filter((x) => x._id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Competitor SEO Tracking
        </h1>
        <p className="text-muted-foreground">
          Track competitor keyword rankings and identify rank gaps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Client</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            placeholder="Client MongoDB ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="max-w-xs"
          />
          <Button
            onClick={() => {
              loadCompetitors(clientId);
              loadRankGap(clientId);
            }}
          >
            Load
          </Button>
        </CardContent>
      </Card>

      {clientId && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tracked Competitors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Competitor name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Input
                  placeholder="Domain (e.g. competitor.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <Button onClick={addCompetitor} disabled={loading}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              {competitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No competitors tracked yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {competitors.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.domain}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCompetitor(c._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Rank Gap Analysis
                {gapLoading && (
                  <span className="text-sm font-normal text-muted-foreground">
                    Loading...
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankGap.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No keyword data. Add competitors and ensure SEO keywords are
                  tracked.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Keyword</th>
                        <th className="pb-2 pr-4 font-medium">Your Rank</th>
                        <th className="pb-2 pr-4 font-medium">
                          Best Competitor
                        </th>
                        <th className="pb-2 font-medium">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankGap.map((kw) => (
                        <tr
                          key={kw.keyword}
                          className="border-b last:border-0"
                        >
                          <td className="py-2 pr-4 font-medium">
                            {kw.keyword}
                          </td>
                          <td className="py-2 pr-4">
                            {kw.clientRank ?? "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {kw.bestCompetitorRank ?? "—"}
                          </td>
                          <td className="py-2">
                            {kw.gap === null ? (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            ) : kw.losing ? (
                              <span className="flex items-center gap-1 text-red-600">
                                <TrendingDown className="h-3.5 w-3.5" />{" "}
                                {Math.abs(kw.gap)} behind
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-3.5 w-3.5" />{" "}
                                {kw.gap} ahead
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
