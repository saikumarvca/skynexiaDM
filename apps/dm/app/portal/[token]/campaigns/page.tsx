import { verifyPortalToken } from "@/lib/portal-auth";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import { notFound } from "next/navigation";

interface CampaignsPortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function PortalCampaignsPage({
  params,
}: CampaignsPortalPageProps) {
  const { token } = await params;
  const clientId = verifyPortalToken(token);
  if (!clientId) notFound();

  await dbConnect();

  const campaigns = await Campaign.find({ clientId })
    .sort({ createdAt: -1 })
    .lean();

  const statusColor = (s: string) => {
    if (s === "ACTIVE") return "bg-green-100 text-green-800";
    if (s === "COMPLETED") return "bg-blue-100 text-blue-800";
    if (s === "PAUSED") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <p className="mt-1 text-gray-500">
          Your active and completed campaigns.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500 shadow-sm">
          No campaigns yet.
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp) => {
            const c = camp as unknown as {
              _id: { toString(): string } | string;
              campaignName?: string;
              platform?: string;
              status?: string;
              objective?: string;
              startDate?: Date;
              endDate?: Date;
              metrics?: {
                impressions?: number;
                clicks?: number;
                conversions?: number;
                ctr?: number;
              };
            };
            const m = c.metrics ?? {};
            return (
              <div
                key={String(c._id)}
                className="rounded-lg border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {c.campaignName ?? "Campaign"}
                    </h3>
                    {c.platform && (
                      <p className="mt-0.5 text-sm text-gray-500">
                        Platform: {c.platform}
                      </p>
                    )}
                    {c.objective && (
                      <p className="text-sm text-gray-500">
                        Objective: {c.objective}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(c.status ?? "")}`}
                  >
                    {c.status ?? "—"}
                  </span>
                </div>

                {(c.startDate || c.endDate) && (
                  <p className="mt-2 text-xs text-gray-400">
                    {c.startDate
                      ? new Date(c.startDate).toLocaleDateString()
                      : "—"}{" "}
                    →{" "}
                    {c.endDate
                      ? new Date(c.endDate).toLocaleDateString()
                      : "Ongoing"}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-md bg-gray-50 p-3 text-center">
                    <p className="text-lg font-semibold text-gray-900">
                      {m.impressions?.toLocaleString() ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">Impressions</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-3 text-center">
                    <p className="text-lg font-semibold text-gray-900">
                      {m.clicks?.toLocaleString() ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-3 text-center">
                    <p className="text-lg font-semibold text-gray-900">
                      {m.conversions?.toLocaleString() ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">Conversions</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
