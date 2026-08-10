import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

interface ChannelRow {
  _id: string;
  platform: string;
  channelId: string;
  channelName?: string;
  subscriberCount: number;
  fetchedAt: string;
  clientId?: { _id: string; name?: string; businessName?: string };
}

async function getChannels(q: {
  clientId?: string;
  platform?: string;
  search?: string;
  sortBy?: string;
}) {
  try {
    const url = new URL("/api/channel-metrics", "http://localhost");
    if (q.clientId) url.searchParams.set("clientId", q.clientId);
    if (q.platform) url.searchParams.set("platform", q.platform);
    if (q.search) url.searchParams.set("search", q.search);
    if (q.sortBy) url.searchParams.set("sortBy", q.sortBy);
    const res = await serverFetch(url.pathname + url.search);
    if (!res.ok) return { channels: [] as ChannelRow[] };
    const data = await res.json();
    return { channels: (data.channels ?? []) as ChannelRow[] };
  } catch {
    return { channels: [] as ChannelRow[] };
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ChannelSubscribesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const clientId = firstString(raw.clientId);
  const platform = firstString(raw.platform);
  const search = firstString(raw.search);
  const sortBy = firstString(raw.sortBy);
  const effectiveSort =
    sortBy === "subscribers" || sortBy === "fetchedAt" ? sortBy : "fetchedAt";

  const { channels } = await getChannels({
    clientId,
    platform,
    search,
    sortBy: effectiveSort,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Channel subscribers
            </h1>
            <p className="text-muted-foreground">
              Subscriber counts by channel and client. Upsert via integrations
              or a future cron job (same pattern as post metrics sync).
            </p>
          </div>
          <form method="get" className="flex flex-wrap gap-2">
            {effectiveSort ? (
              <input type="hidden" name="sortBy" value={effectiveSort} />
            ) : null}
            <input
              name="clientId"
              defaultValue={clientId ?? ""}
              placeholder="Client ID"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-40"
            />
            <input
              name="platform"
              defaultValue={platform ?? ""}
              placeholder="Platform"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-32"
            />
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="Channel name / ID"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-44"
            />
            <button
              type="submit"
              className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Sort:</span>
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={`/channels/subscribe?${new URLSearchParams({
              ...(clientId ? { clientId } : {}),
              ...(platform ? { platform } : {}),
              ...(search ? { search } : {}),
              sortBy: "fetchedAt",
            }).toString()}`}
          >
            Last fetched
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={`/channels/subscribe?${new URLSearchParams({
              ...(clientId ? { clientId } : {}),
              ...(platform ? { platform } : {}),
              ...(search ? { search } : {}),
              sortBy: "subscribers",
            }).toString()}`}
          >
            Subscribers
          </a>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Channels ({channels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>
                  No channel metrics yet. Rows appear when integrations or sync
                  jobs create ChannelMetrics documents.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Client</th>
                      <th className="pb-2 pr-4 font-medium">Platform</th>
                      <th className="pb-2 pr-4 font-medium">Channel</th>
                      <th className="pb-2 pr-4 font-medium">Channel ID</th>
                      <th className="pb-2 pr-4 font-medium text-right">
                        Subscribers
                      </th>
                      <th className="pb-2 font-medium">Fetched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((c) => {
                      const cli = c.clientId;
                      const clientLabel =
                        cli &&
                        (cli.businessName || cli.name || String(cli._id));
                      return (
                        <tr
                          key={c._id}
                          className="border-b last:border-0 hover:bg-muted/40"
                        >
                          <td className="py-2.5 pr-4">
                            {clientLabel ?? "—"}
                          </td>
                          <td className="py-2.5 pr-4 capitalize">
                            {c.platform}
                          </td>
                          <td className="py-2.5 pr-4 font-medium">
                            {c.channelName ?? "—"}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-xs">
                            {c.channelId}
                          </td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">
                            {c.subscriberCount.toLocaleString()}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {new Date(c.fetchedAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
