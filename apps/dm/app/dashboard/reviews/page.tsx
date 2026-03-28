import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ReviewTable } from "@/components/review-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Review, MarkUsedFormData, Client } from "@/types"
import dbConnect from "@/lib/mongodb"
import ReviewModel from "@/models/Review"
import ClientModel from "@/models/Client"
import { ExportButton } from "@/components/export-button"
import { PdfExportButton } from "@/components/pdf-export-button"

import { serverFetch } from "@/lib/server-fetch"

async function getReviews(params: {
  clientId?: string
  search?: string
  status?: string
  category?: string
  language?: string
}): Promise<Review[]> {
  await dbConnect()
  const query: Record<string, unknown> = {}
  if (params.clientId) query.clientId = params.clientId
  if (params.status && params.status !== "ALL") query.status = params.status
  if (params.category) query.category = params.category
  if (params.language) query.language = params.language
  if (params.search) {
    query.$or = [
      { shortLabel: { $regex: params.search, $options: "i" } },
      { reviewText: { $regex: params.search, $options: "i" } },
      { category: { $regex: params.search, $options: "i" } },
    ]
  }
  return (await ReviewModel.find(query)
    .populate("clientId", "name businessName")
    .sort({ createdAt: -1 })
    .lean()
  ).map((r) => JSON.parse(JSON.stringify(r)))
}

async function getClients(): Promise<Client[]> {
  try {
    await dbConnect()
    const docs = await ClientModel.find({}).sort({ createdAt: -1 }).limit(500).lean()
    return docs.map((c) => JSON.parse(JSON.stringify(c)))
  } catch (error) {
    console.error("Error fetching clients:", error)
    return []
  }
}

async function markReviewUsed(data: MarkUsedFormData) {
  "use server"

  const res = await serverFetch('/api/reviews/mark-used', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("Failed to mark review as used")
  }

  return res.json()
}

async function archiveReview(reviewId: string) {
  "use server"

  const res = await serverFetch(`/api/reviews/${reviewId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "ARCHIVED" }),
  })

  if (!res.ok) {
    throw new Error("Failed to archive review")
  }

  return res.json()
}

interface PageProps {
  searchParams: Promise<{
    clientId?: string
    search?: string
    status?: string
    category?: string
    language?: string
  }>
}

export default async function DashboardReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [reviews, clients] = await Promise.all([
    getReviews({
      clientId: params.clientId && params.clientId !== "ALL" ? params.clientId : undefined,
      search: params.search,
      status: params.status,
      category: params.category,
      language: params.language,
    }),
    getClients(),
  ])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reviews Overview</h1>
              <p className="text-muted-foreground">
                View and manage actual review records across all clients. For the draft bank and allocation workflow, use the modules below.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton
                href={`/api/export/reviews${
                  params.clientId && params.clientId !== "ALL" ? `?clientId=${params.clientId}` : ""
                }${
                  params.status && params.status !== "ALL"
                    ? `${params.clientId && params.clientId !== "ALL" ? "&" : "?"}status=${params.status}`
                    : ""
                }`}
              />
              <PdfExportButton
                href={`/api/export/reviews/pdf${
                  params.clientId && params.clientId !== "ALL" ? `?clientId=${params.clientId}` : ""
                }${
                  params.status && params.status !== "ALL"
                    ? `${params.clientId && params.clientId !== "ALL" ? "&" : "?"}status=${params.status}`
                    : ""
                }`}
              />
              <Link href="/clients">
                <Button variant="outline">Go to clients</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <h2 className="font-medium mb-2">Draft &amp; Allocation Workflow</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Suggested Comment Bank → Allocate to Team → Share with Customer → Customer Posts → Mark as Used
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/review-drafts">
                <Button variant="outline" size="sm">Review Drafts</Button>
              </Link>
              <Link href="/dashboard/review-allocations">
                <Button variant="outline" size="sm">Review Allocations</Button>
              </Link>
              <Link href="/dashboard/my-assigned-reviews">
                <Button variant="outline" size="sm">My Assigned Reviews</Button>
              </Link>
              <Link href="/dashboard/used-reviews">
                <Button variant="outline" size="sm">Used Reviews</Button>
              </Link>
              <Link href="/dashboard/review-analytics">
                <Button variant="outline" size="sm">Review Analytics</Button>
              </Link>
            </div>
          </div>
        </div>

        <form method="get" action="/dashboard/reviews" className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-2">
            <Input
              name="search"
              placeholder="Search by text, label, or category..."
              defaultValue={params.search || ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
            <select
              name="status"
              defaultValue={params.status || "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="ALL">All status</option>
              <option value="UNUSED">Unused</option>
              <option value="USED">Used</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <Input
              name="category"
              placeholder="Category"
              defaultValue={params.category || ""}
            />
          </div>
          <div>
            <Input
              name="language"
              placeholder="Language"
              defaultValue={params.language || ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Client</label>
            <select
              name="clientId"
              defaultValue={params.clientId || "ALL"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="ALL">All clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.businessName}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-5 flex justify-end">
            <Button type="submit" variant="outline">
              Apply filters
            </Button>
          </div>
        </form>

        <ReviewTable
          reviews={reviews}
          onMarkUsed={markReviewUsed}
          onArchive={archiveReview}
        />
      </div>
    </DashboardLayout>
  )
}
