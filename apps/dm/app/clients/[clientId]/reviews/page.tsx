import { DashboardLayout } from "@/components/dashboard-layout"
import { ReviewTable } from "@/components/review-table"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Review, MarkUsedFormData } from "@/types"

async function getClientReviews(clientId: string): Promise<Review[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reviews?clientId=${clientId}`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch reviews')
    return res.json()
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

async function markReviewUsed(data: MarkUsedFormData) {
  'use server'

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reviews/mark-used`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error('Failed to mark review as used')
  }

  return res.json()
}

async function archiveReview(reviewId: string) {
  'use server'

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reviews/${reviewId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'ARCHIVED' }),
  })

  if (!res.ok) {
    throw new Error('Failed to archive review')
  }

  return res.json()
}

interface ClientReviewsPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientReviewsPage({ params }: ClientReviewsPageProps) {
  const { clientId } = await params
  const reviews = await getClientReviews(clientId)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/clients/${clientId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Client
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Client Reviews</h1>
              <p className="text-muted-foreground">
                Manage reviews for this client.
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/clients/${clientId}/reviews/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Review
              </Button>
            </Link>
            <Link href={`/clients/${clientId}/reviews/bulk`}>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
            </Link>
          </div>
        </div>

        <ReviewTable
          reviews={reviews}
          onMarkUsed={markReviewUsed}
          onArchive={archiveReview}
        />
      </div>
    </DashboardLayout>
  )
}