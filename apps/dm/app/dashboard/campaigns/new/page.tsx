import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CampaignForm } from "@/components/campaign-form"

import { getBaseUrl } from "@/lib/server-fetch"
const BASE = getBaseUrl()

async function getClients() {
  try {
    const res = await fetch(`${BASE}/api/clients?limit=500`, { cache: "no-store" })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const params = await searchParams
  const clients = await getClients()

  async function createCampaign(formData: FormData) {
    "use server"
    const clientId = formData.get("clientId") as string
    const campaignName = formData.get("campaignName") as string
    const platform = formData.get("platform") as string
    if (!clientId || !campaignName || !platform) {
      throw new Error("Client, campaign name, and platform are required")
    }
    const budget = formData.get("budget")
    const startDate = formData.get("startDate")
    const endDate = formData.get("endDate")
    const res = await fetch(`${BASE}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        campaignName,
        platform,
        objective: (formData.get("objective") as string) || undefined,
        budget: budget ? Number(budget) : undefined,
        startDate: startDate ? new Date(startDate as string).toISOString() : undefined,
        endDate: endDate ? new Date(endDate as string).toISOString() : undefined,
        status: (formData.get("status") as string) || "PLANNED",
        notes: (formData.get("notes") as string) || undefined,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to create campaign")
    }
    redirect("/dashboard/campaigns")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New campaign</h1>
            <p className="text-muted-foreground">
              Create a new marketing campaign and link it to a client.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <CampaignForm
            clients={clients}
            action={createCampaign}
            defaultClientId={params.clientId}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
