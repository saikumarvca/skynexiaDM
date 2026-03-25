import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { LeadForm } from "@/components/lead-form"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152"

async function getClients() {
  try {
    const res = await fetch(`${BASE}/api/clients?limit=500`, { cache: "no-store" })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

async function getCampaigns() {
  try {
    const res = await fetch(`${BASE}/api/campaigns`, { cache: "no-store" })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const params = await searchParams
  const [clients, campaigns] = await Promise.all([getClients(), getCampaigns()])

  async function createLead(formData: FormData) {
    "use server"
    const clientId = formData.get("clientId") as string
    const name = (formData.get("name") as string)?.trim()
    if (!clientId || !name) throw new Error("Client and name are required")
    const campaignId = formData.get("campaignId") as string
    const res = await fetch(`${BASE}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        name,
        email: (formData.get("email") as string)?.trim() || undefined,
        phone: (formData.get("phone") as string)?.trim() || undefined,
        source: (formData.get("source") as string)?.trim() || undefined,
        campaignId: campaignId && campaignId !== "" ? campaignId : null,
        status: (formData.get("status") as string) || "NEW",
        notes: (formData.get("notes") as string)?.trim() || undefined,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to add lead")
    }
    redirect("/dashboard/leads")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add lead</h1>
            <p className="text-muted-foreground">
              Add a new lead and link to a client and optional campaign.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <LeadForm
            clients={clients}
            campaigns={campaigns}
            action={createLead}
            defaultClientId={params.clientId}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
