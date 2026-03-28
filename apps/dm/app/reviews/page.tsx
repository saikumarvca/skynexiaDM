import { DashboardLayout } from "@/components/dashboard-layout"
import { ReviewTable } from "@/components/review-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Review } from "@/types"
import { getBaseUrl } from "@/lib/server-fetch"

async function getReviews(searchParams: {
  search?: string
  status?: string
  category?: string
  language?: string
}) {
  const url = new URL(`${getBaseUrl()}/api/reviews`)
  if (searchParams.search) url.searchParams.set('search', searchParams.search)
  if (searchParams.status) url.searchParams.set('status', searchParams.status)
  if (searchParams.category) url.searchParams.set('category', searchParams.category)
  if (searchParams.language) url.searchParams.set('language', searchParams.language)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch reviews')
  }
  return res.json() as Promise<Review[]>
}

interface ReviewsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    category?: string
    language?: string
  }>
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams
  const reviews = await getReviews(params)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Reviews</h1>
            <p className="text-muted-foreground">
              Browse and manage reviews across all clients.
            </p>
          </div>
        </div>

        <form className="grid gap-4 md:grid-cols-4">
          <Input
            name="search"
            placeholder="Search by text, label, or category..."
            defaultValue={params.search || ""}
          />
          <Select name="status" defaultValue={params.status || "ALL"}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All status</SelectItem>
              <SelectItem value="UNUSED">Unused</SelectItem>
              <SelectItem value="USED">Used</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Input
            name="category"
            placeholder="Category"
            defaultValue={params.category || ""}
          />
          <Input
            name="language"
            placeholder="Language"
            defaultValue={params.language || ""}
          />
          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" variant="outline">
              Apply filters
            </Button>
          </div>
        </form>

        <ReviewTable
          reviews={reviews}
          onMarkUsed={async () => {
            "use server"
            
          }}
          onArchive={async () => {
            "use server"
          }}
        />
      </div>
    </DashboardLayout>
  )
}

