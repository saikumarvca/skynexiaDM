import { verifyPortalToken } from "@/lib/portal-auth";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import { notFound } from "next/navigation";

interface ReviewsPortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function PortalReviewsPage({
  params,
}: ReviewsPortalPageProps) {
  const { token } = await params;
  const clientId = verifyPortalToken(token);
  if (!clientId) notFound();

  await dbConnect();

  const reviews = await Review.find({ clientId }).lean();

  // Count by status
  const countByStatus: Record<string, number> = {};
  for (const r of reviews) {
    const status = (r as { status?: string }).status ?? "UNKNOWN";
    countByStatus[status] = (countByStatus[status] ?? 0) + 1;
  }

  const statusEntries = Object.entries(countByStatus).sort(
    (a, b) => b[1] - a[1],
  );

  const statusColor = (s: string) => {
    if (s === "UNUSED") return "bg-blue-100 text-blue-800";
    if (s === "USED") return "bg-green-100 text-green-800";
    if (s === "ARCHIVED") return "bg-gray-100 text-gray-700";
    return "bg-gray-100 text-gray-700";
  };

  // Only show non-sensitive info: show used/archived reviews but hide full text for UNUSED (privacy)
  const visibleReviews = reviews
    .filter((r) => (r as { status?: string }).status !== "UNUSED")
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-gray-500">Your review status overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statusEntries.map(([status, count]) => (
          <div
            key={status}
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(status)}`}
            >
              {status}
            </span>
            <p className="mt-2 text-3xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
        {statusEntries.length === 0 && (
          <div className="col-span-3 rounded-lg border bg-white p-8 text-center text-gray-500 shadow-sm">
            No reviews yet.
          </div>
        )}
      </div>

      {visibleReviews.length > 0 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Recent Reviews
          </h2>
          <div className="space-y-3">
            {visibleReviews.map((r) => {
              const rev = r as unknown as {
                _id: { toString(): string } | string;
                status?: string;
                platform?: string;
                language?: string;
                createdAt?: Date;
                shortLabel?: string;
              };
              return (
                <div
                  key={String(rev._id)}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(rev.status ?? "")}`}
                    >
                      {rev.status ?? "—"}
                    </span>
                    {rev.platform && (
                      <span className="ml-2 text-xs text-gray-500">
                        {rev.platform}
                      </span>
                    )}
                    {rev.language && (
                      <span className="ml-2 text-xs text-gray-400">
                        {rev.language}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
