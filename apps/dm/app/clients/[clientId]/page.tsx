import { DashboardLayout } from "@/components/dashboard-layout";
import { StatsCard } from "@/components/stats-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Client } from "@/types";
import {
  FileText,
  CheckCircle,
  Archive,
  Edit,
  Plus,
  Target,
  ListChecks,
  FileStack,
  LineChart,
  Layers,
  Search,
  Download,
} from "lucide-react";
import Link from "next/link";
import { CollapsibleClientInfo } from "@/components/collapsible-client-info";
import { CollapsibleStats } from "@/components/collapsible-stats";
import { serverFetch } from "@/lib/server-fetch";
import { GeneratePortalLinkButton } from "@/components/generate-portal-link-button";
import { ClientPerformanceCharts } from "@/components/clients/client-performance-charts";

type UsageItem = {
  _id: string;
  reviewId: {
    _id: string;
    shortLabel: string;
  };
  sourceName: string;
  usedBy: string;
  profileName: string;
  usedAt: string;
  notes?: string;
};

type ClientAnalytics = {
  summary: {
    totalReviews: number;
    unusedReviews: number;
    usedReviews: number;
    archivedReviews: number;
    totalUsage: number;
  };
  byPlatform: { platform: string; count: number }[];
  byLanguage: { language: string; count: number }[];
  usageOverTime: { date: string; count: number }[];
  recommendations: {
    id: string;
    severity: "low" | "medium" | "high";
    title: string;
    description: string;
  }[];
  campaignsByStatus?: { status: string; count: number }[];
  leadsByStatus?: { status: string; count: number }[];
};

async function getClient(clientId: string): Promise<Client | null> {
  try {
    const res = await serverFetch(`/api/clients/${clientId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

async function getClientStats(clientId: string) {
  try {
    const res = await serverFetch(`/api/clients/${clientId}/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch (error) {
    console.error("Error fetching client stats:", error);
    return {
      totalReviews: 0,
      unusedReviews: 0,
      usedReviews: 0,
      totalUsage: 0,
    };
  }
}

async function getClientUsage(clientId: string): Promise<UsageItem[]> {
  try {
    const res = await serverFetch(
      `/api/review-usage?clientId=${encodeURIComponent(clientId)}`,
    );
    if (!res.ok) {
      throw new Error("Failed to fetch usage");
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching client usage:", error);
    return [];
  }
}

async function getClientAnalytics(
  clientId: string,
): Promise<ClientAnalytics | null> {
  try {
    const res = await serverFetch(`/api/clients/${clientId}/analytics`);
    if (!res.ok) {
      throw new Error("Failed to fetch analytics");
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching client analytics:", error);
    return null;
  }
}

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  const stats = await getClientStats(clientId);
  const [usage, analytics] = await Promise.all([
    getClientUsage(clientId),
    getClientAnalytics(clientId),
  ]);

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Client not found</h1>
          <p className="text-muted-foreground">
            The client you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/clients">
            <Button className="mt-4">Back to Clients</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/clients"
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
            >
              ← Back to clients
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {client.name}
            </h1>
            <p className="text-muted-foreground">{client.businessName}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StatusBadge status={client.status} />
            <GeneratePortalLinkButton clientId={String(client._id)} />
            <Link href={`/api/export/client-data?clientId=${client._id}`}>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </Link>
            <Link href={`/clients/${client._id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <CollapsibleStats label="stats">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Reviews"
              value={stats.totalReviews}
              icon={FileText}
              description="All reviews"
            />
            <StatsCard
              title="Unused Reviews"
              value={stats.unusedReviews}
              icon={CheckCircle}
              description="Available for use"
            />
            <StatsCard
              title="Used Reviews"
              value={stats.usedReviews}
              icon={Archive}
              description="Already utilized"
            />
            <StatsCard
              title="Total Usage"
              value={stats.totalUsage}
              icon={FileText}
              description="Usage records"
            />
          </div>
        </CollapsibleStats>

        <CollapsibleClientInfo client={client} />

        {/* Tabs */}
        <Tabs defaultValue="reviews" className="min-w-0 space-y-4">
          <TabsList>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Reviews</h2>
              <div className="flex flex-wrap gap-2">
                <Link href={`/clients/${client._id}/reviews/new`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Review
                  </Button>
                </Link>
                <Link href={`/clients/${client._id}/reviews/bulk`}>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Bulk Import
                  </Button>
                </Link>
              </div>
            </div>
            <Link href={`/clients/${client._id}/reviews`}>
              <Button variant="outline">View All Reviews</Button>
            </Link>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <h2 className="text-xl font-semibold">Usage History</h2>
            {usage.length === 0 ? (
              <p className="text-muted-foreground">
                No usage records found for this client yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Review</th>
                      <th className="px-4 py-2 text-left">Platform</th>
                      <th className="px-4 py-2 text-left">Profile</th>
                      <th className="px-4 py-2 text-left">Used By</th>
                      <th className="px-4 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.map((item) => (
                      <tr key={item._id} className="border-t">
                        <td className="px-4 py-2">
                          {new Date(item.usedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          {item.reviewId?.shortLabel || "N/A"}
                        </td>
                        <td className="px-4 py-2">{item.sourceName}</td>
                        <td className="px-4 py-2">{item.profileName}</td>
                        <td className="px-4 py-2">{item.usedBy}</td>
                        <td
                          className="px-4 py-2 max-w-xs truncate"
                          title={item.notes}
                        >
                          {item.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-xl font-semibold">Analytics</h2>
            {!analytics ? (
              <p className="text-muted-foreground">
                Analytics are not available for this client yet.
              </p>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatsCard
                    title="Total Reviews"
                    value={analytics.summary.totalReviews}
                    icon={FileText}
                    description="All reviews (including archived)"
                  />
                  <StatsCard
                    title="Unused Reviews"
                    value={analytics.summary.unusedReviews}
                    icon={CheckCircle}
                    description="Available for use"
                  />
                  <StatsCard
                    title="Used Reviews"
                    value={analytics.summary.usedReviews}
                    icon={Archive}
                    description="Already utilized"
                  />
                  <StatsCard
                    title="Total Usage"
                    value={analytics.summary.totalUsage}
                    icon={FileText}
                    description="Usage records"
                  />
                  {Array.isArray(analytics.campaignsByStatus) &&
                    analytics.campaignsByStatus.length > 0 && (
                      <StatsCard
                        title="Total Campaigns"
                        value={analytics.campaignsByStatus.reduce(
                          (sum, c) => sum + c.count,
                          0,
                        )}
                        icon={Target}
                        description="Campaigns across all statuses"
                      />
                    )}
                  {Array.isArray(analytics.leadsByStatus) &&
                    analytics.leadsByStatus.length > 0 && (
                      <StatsCard
                        title="Total Leads"
                        value={analytics.leadsByStatus.reduce(
                          (sum, l) => sum + l.count,
                          0,
                        )}
                        icon={LineChart}
                        description="Leads in all stages"
                      />
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage by Platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.byPlatform.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No usage data by platform yet.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {analytics.byPlatform.map((item) => (
                            <li
                              key={item.platform}
                              className="flex items-center justify-between"
                            >
                              <span>{item.platform}</span>
                              <span className="font-medium">{item.count}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Reviews by Language</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.byLanguage.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No language breakdown available.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {analytics.byLanguage.map((item) => (
                            <li
                              key={item.language}
                              className="flex items-center justify-between"
                            >
                              <span>{item.language}</span>
                              <span className="font-medium">{item.count}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaigns by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!analytics.campaignsByStatus ||
                      analytics.campaignsByStatus.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No campaigns yet.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {analytics.campaignsByStatus.map((item) => (
                            <li
                              key={item.status}
                              className="flex items-center justify-between"
                            >
                              <span>{item.status}</span>
                              <span className="font-medium">{item.count}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Leads by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!analytics.leadsByStatus ||
                      analytics.leadsByStatus.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No leads yet.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {analytics.leadsByStatus.map((item) => (
                            <li
                              key={item.status}
                              className="flex items-center justify-between"
                            >
                              <span>{item.status}</span>
                              <span className="font-medium">{item.count}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.recommendations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No specific recommendations at this time. Keep using
                        reviews consistently across platforms.
                      </p>
                    ) : (
                      <ul className="space-y-3 text-sm">
                        {analytics.recommendations.map((rec) => (
                          <li key={rec.id}>
                            <p className="font-medium">{rec.title}</p>
                            <p className="text-muted-foreground">
                              {rec.description}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Performance Charts
                  </h3>
                  <ClientPerformanceCharts clientId={clientId} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-xl font-semibold">Client Settings</h2>
            <p className="text-muted-foreground">
              Client configuration options will be available here.
            </p>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <h2 className="text-xl font-semibold">Campaigns</h2>
            <p className="text-muted-foreground mb-4">
              Manage campaigns for this client.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/campaigns?clientId=${client._id}`}>
                <Button variant="outline">
                  <Target className="mr-2 h-4 w-4" />
                  View campaigns
                </Button>
              </Link>
              <Link href={`/dashboard/campaigns/new?clientId=${client._id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New campaign
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <h2 className="text-xl font-semibold">Content</h2>
            <p className="text-muted-foreground mb-4">
              Manage content assets for this client.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/content?clientId=${client._id}`}>
                <Button variant="outline">
                  <Layers className="mr-2 h-4 w-4" />
                  View content
                </Button>
              </Link>
              <Link href={`/dashboard/content/new?clientId=${client._id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New content
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <h2 className="text-xl font-semibold">SEO</h2>
            <p className="text-muted-foreground mb-4">
              Track keywords and SEO for this client.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/seo?clientId=${client._id}`}>
                <Button variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  View keywords
                </Button>
              </Link>
              <Link href={`/dashboard/seo/new?clientId=${client._id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add keyword
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <h2 className="text-xl font-semibold">Leads</h2>
            <p className="text-muted-foreground mb-4">
              View and manage leads generated for this client.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/leads?clientId=${client._id}`}>
                <Button variant="outline">
                  <LineChart className="mr-2 h-4 w-4" />
                  View leads
                </Button>
              </Link>
              <Link href={`/dashboard/leads/new?clientId=${client._id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add lead
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <p className="text-muted-foreground mb-4">
              Track work items related to this client.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/tasks?clientId=${client._id}`}>
                <Button variant="outline">
                  <ListChecks className="mr-2 h-4 w-4" />
                  View tasks
                </Button>
              </Link>
              <Link href={`/dashboard/tasks/new?clientId=${client._id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add task
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <h2 className="text-xl font-semibold">Files</h2>
            <p className="text-muted-foreground mb-4">
              Browse and manage this client&apos;s assets and creative files.
            </p>
            <Link href={`/clients/${client._id}/files`}>
              <Button variant="outline">
                <FileStack className="mr-2 h-4 w-4" />
                Open files
              </Button>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
