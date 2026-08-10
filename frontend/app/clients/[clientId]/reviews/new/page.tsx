import { DashboardLayout } from "@/components/dashboard-layout";
import { ReviewForm } from "@/components/review-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReviewFormData } from "@/types";
import { serverFetch } from "@/lib/server-fetch";

async function createReview(data: ReviewFormData) {
  "use server";

  const res = await serverFetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create review");
  }

  return await res.json();
}

interface NewReviewPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function NewReviewPage({ params }: NewReviewPageProps) {
  const { clientId } = await params;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href={`/clients/${clientId}/reviews`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reviews
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Add New Review
            </h1>
            <p className="text-muted-foreground">
              Create a new review for this client.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <ReviewForm clientId={clientId} onSubmit={createReview} />
        </div>
      </div>
    </DashboardLayout>
  );
}
