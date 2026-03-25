import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { KeywordForm } from "@/components/keyword-form"

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

export default async function NewKeywordPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const params = await searchParams
  const clients = await getClients()

  async function createKeyword(formData: FormData) {
    "use server"
    const clientId = formData.get("clientId") as string
    const keyword = (formData.get("keyword") as string)?.trim()
    if (!clientId || !keyword) throw new Error("Client and keyword are required")
    const searchVolume = formData.get("searchVolume")
    const difficulty = formData.get("difficulty")
    const rank = formData.get("rank")
    const targetUrl = (formData.get("targetUrl") as string)?.trim()
    const competitorUrlsRaw = (formData.get("competitorUrls") as string)?.trim()
    const competitorUrls = competitorUrlsRaw
      ? competitorUrlsRaw.split(",").map((u) => u.trim()).filter(Boolean)
      : undefined
    const res = await fetch(`${BASE}/api/keywords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        keyword,
        searchVolume: searchVolume ? Number(searchVolume) : undefined,
        difficulty: difficulty ? Number(difficulty) : undefined,
        rank: rank ? Number(rank) : undefined,
        targetUrl: targetUrl || undefined,
        competitorUrls,
        lastUpdated: new Date().toISOString(),
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to add keyword")
    }
    redirect("/dashboard/seo")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/seo">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add keyword</h1>
            <p className="text-muted-foreground">
              Track a keyword for a client: rank, search volume, difficulty.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <KeywordForm
            clients={clients}
            action={createKeyword}
            defaultClientId={params.clientId}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
