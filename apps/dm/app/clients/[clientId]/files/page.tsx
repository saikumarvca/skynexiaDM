import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileStack } from "lucide-react"

export default async function ClientFilesPage({
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
            <h1 className="text-3xl font-bold tracking-tight">Files</h1>
            <p className="text-muted-foreground">
              Brand assets and creative files for this client.
            </p>
          </div>
          <Link href={`/dashboard/content?clientId=${clientId}`}>
            <Button variant="outline">
              <FileStack className="mr-2 h-4 w-4" />
              Open content bank
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

