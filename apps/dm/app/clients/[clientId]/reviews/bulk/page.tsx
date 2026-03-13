import { DashboardLayout } from "@/components/dashboard-layout"
import { BulkReviewForm } from "@/components/bulk-review-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { BulkReviewFormData } from "@/types"

async function createBulkReviews(data: BulkReviewFormData) {
  'use server'

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reviews/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error('Failed to create bulk reviews')
  }

  return res.json()
}

interface BulkReviewPageProps {
  params: { clientId: string }
}

export default function BulkReviewPage({ params }: BulkReviewPageProps) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href={`/clients/${params.clientId}/reviews`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reviews
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Import Reviews</h1>
            <p className="text-muted-foreground">
              Import multiple reviews at once for this client.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <BulkReviewForm clientId={params.clientId} onSubmit={createBulkReviews} />
        </div>
      </div>
    </DashboardLayout>
  )
}