import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ImageIcon } from "lucide-react";
import { requireClientSession } from "@/lib/client-portal/session";
import { getClientReviewDetail } from "@/lib/client-portal/reviews";
import { formatDate } from "@/components/client-portal/format";
import {
  PortalPageHeader,
  RatingStars,
  SectionCard,
  StatusPill,
} from "@/components/client-portal/ui/primitives";
import { ReviewTimeline } from "@/components/client-portal/reviews/review-timeline";

export const dynamic = "force-dynamic";

export default async function ClientReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireClientSession();
  const { id } = await params;
  const review = await getClientReviewDetail(ctx.clientId, id);
  if (!review) notFound();

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Customer", value: review.customerName ?? "Not yet assigned" },
    { label: "Platform", value: review.platform ?? "—" },
    { label: "Rating", value: <RatingStars rating={review.rating} /> },
    { label: "Status", value: <StatusPill status={review.status} /> },
    { label: "Shared date", value: formatDate(review.sharedDate) },
    { label: "Posted date", value: formatDate(review.postedDate) },
    ...(review.category ? [{ label: "Category", value: review.category }] : []),
    ...(review.language ? [{ label: "Language", value: review.language }] : []),
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/client/reviews"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to reviews
      </Link>
      <PortalPageHeader
        title={review.subject || "Review"}
        subtitle={
          review.customerName
            ? `Review for ${review.customerName}`
            : "Review draft prepared for your business"
        }
        actions={<StatusPill status={review.status} className="text-sm" />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <SectionCard title="Review Information">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-sm">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Review text
              </p>
              <blockquote className="mt-2 whitespace-pre-wrap rounded-lg border-l-4 border-primary/50 bg-muted/40 p-4 text-[15px] leading-relaxed">
                {review.reviewText}
              </blockquote>
            </div>
            {review.reviewLink || review.proofUrl ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {review.reviewLink ? (
                  <a
                    href={review.reviewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground no-underline hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Open live review
                  </a>
                ) : null}
                {review.proofUrl ? (
                  <a
                    href={review.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium no-underline hover:bg-muted"
                  >
                    <ImageIcon className="h-4 w-4" aria-hidden />
                    View screenshot proof
                  </a>
                ) : null}
              </div>
            ) : null}
          </SectionCard>
        </div>
        <SectionCard title="Timeline" description="How this review has progressed">
          <ReviewTimeline events={review.timeline} />
        </SectionCard>
      </div>
    </div>
  );
}
