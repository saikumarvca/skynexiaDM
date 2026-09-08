import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/client-portal/ui/primitives";

export default function ClientReviewNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Review not found"
      description="This review does not exist or is not part of your account."
      action={
        <Link
          href="/client/reviews"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground no-underline"
        >
          Back to reviews
        </Link>
      }
      className="mt-10 bg-card"
    />
  );
}
