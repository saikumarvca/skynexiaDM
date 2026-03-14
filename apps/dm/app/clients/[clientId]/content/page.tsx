import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Layers, Plus } from "lucide-react"

export default async function ClientContentPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/clients/${clientId}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to client
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Content</h1>
            <p className="text-muted-foreground">
              Content bank entries for this client.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/content?clientId=${clientId}`}>
              <Button variant="outline">
                <Layers className="mr-2 h-4 w-4" />
                View content
              </Button>
            </Link>
            <Link href={`/dashboard/content/new?clientId=${clientId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New content
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

