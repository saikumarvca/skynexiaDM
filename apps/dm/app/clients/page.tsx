import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientCard } from "@/components/client-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { Client } from "@/types"

async function getClients(search?: string, viewId?: string): Promise<Client[]> {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clients`)
    if (search) url.searchParams.set('search', search)
    if (viewId) url.searchParams.set('viewId', viewId)

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch clients')
    return res.json()
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}

async function getClientViews() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/client-views`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch views')
    return res.json() as Promise<{ _id: string; name: string }[]>
  } catch (error) {
    console.error('Error fetching client views:', error)
    return []
  }
}

interface ClientsPageProps {
  searchParams: Promise<{ search?: string; viewId?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams
  const [clients, views] = await Promise.all([
    getClients(params.search, params.viewId),
    getClientViews(),
  ])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">
              Manage your client accounts and their review portfolios.
            </p>
          </div>
          <Link href="/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>

        {/* Search & views */}
        <form method="get" action="/clients" className="flex items-center gap-4">
          <Input
            name="search"
            placeholder="Search clients..."
            defaultValue={params.search || ""}
            className="max-w-sm"
          />
          {views.length > 0 && (
            <select
              name="viewId"
              defaultValue={params.viewId || ""}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All clients</option>
              {views.map((view) => (
                <option key={view._id} value={view._id}>
                  {view.name}
                </option>
              ))}
            </select>
          )}
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {/* Clients Grid */}
        {clients.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <ClientCard key={client._id} client={client} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Plus className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first client.
            </p>
            <div className="mt-6">
              <Link href="/clients/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}