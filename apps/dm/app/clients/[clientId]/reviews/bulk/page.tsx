import { DashboardLayout } from "@/components/dashboard-layout"
import { BulkReviewForm } from "@/components/bulk-review-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { BulkReviewFormData } from "@/types"
import { serverFetch } from "@/lib/server-fetch"

async function createBulkReviews(data: BulkReviewFormData) {
  'use server'

  const res = await serverFetch('/api/reviews/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error('Failed to create bulk reviews')
  }

  return await res.json()
}

interface BulkReviewPageProps {
  params: Promise<{ clientId: string }>
}

export default async function BulkReviewPage({ params }: BulkReviewPageProps) {
  const { clientId } = await params

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
            <h1 className="text-3xl font-bold tracking-tight">Bulk Import Reviews</h1>
            <p className="text-muted-foreground">
              Import multiple reviews at once for this client.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <BulkReviewForm clientId={clientId} onSubmit={createBulkReviews} />
        </div>
      </div>
    </DashboardLayout>
  )
}