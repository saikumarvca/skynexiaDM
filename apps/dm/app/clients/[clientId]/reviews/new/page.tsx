import { DashboardLayout } from "@/components/dashboard-layout"
import { ReviewForm } from "@/components/review-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ReviewFormData } from "@/types"

async function createReview(data: ReviewFormData) {
  'use server'

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error('Failed to create review')
  }

  return res.json()
}

interface NewReviewPageProps {
  params: { clientId: string }
}

export default function NewReviewPage({ params }: NewReviewPageProps) {
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
            <h1 className="text-3xl font-bold tracking-tight">Add New Review</h1>
            <p className="text-muted-foreground">
              Create a new review for this client.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <ReviewForm clientId={params.clientId} onSubmit={createReview} />
        </div>
      </div>
    </DashboardLayout>
  )
}