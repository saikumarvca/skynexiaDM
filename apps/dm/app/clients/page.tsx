import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientCard } from "@/components/client-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Archive } from "lucide-react"
import { Client } from "@/types"
import dbConnect from "@/lib/mongodb"
import ClientModel from "@/models/Client"
import ClientView from "@/models/ClientView"

async function getClients(
  search?: string,
  viewId?: string,
  archived?: boolean
): Promise<Client[]> {
  try {
    await dbConnect()
    let baseQuery: Record<string, unknown> = {}
    if (search) {
      baseQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { businessName: { $regex: search, $options: 'i' } },
          { brandName: { $regex: search, $options: 'i' } },
          { contactName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      }
    }
    let filters: Record<string, unknown> = {}
    if (viewId) {
      const view = await ClientView.findById(viewId)
      if (view) filters = view.filters as Record<string, unknown>
    }
    const merged = { ...filters, ...baseQuery }
    const docs = await ClientModel.find({
      ...merged,
      ...(archived ? { status: "ARCHIVED" } : { status: { $ne: "ARCHIVED" } }),
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    return docs.map((c) => JSON.parse(JSON.stringify(c)))
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}

async function getClientViews(): Promise<{ _id: string; name: string }[]> {
  try {
    await dbConnect()
    const docs = await ClientView.find().sort({ createdAt: -1 }).lean()
    return docs.map((v) => ({ _id: v._id.toString(), name: v.name }))
  } catch (error) {
    console.error('Error fetching client views:', error)
    return []
  }
}

interface ClientsPageProps {
  searchParams: Promise<{ search?: string; viewId?: string; archived?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams
  const showArchived = params.archived === "1" || params.archived === "true"
  const [clients, views] = await Promise.all([
    getClients(params.search, params.viewId, showArchived),
    getClientViews(),
  ])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {showArchived ? "Archived clients" : "Clients"}
            </h1>
            <p className="text-muted-foreground">
              {showArchived
                ? "Clients removed from the main list. Open a card to view details."
                : "Manage your client accounts and their review portfolios."}
            </p>
            <div className="mt-3">
              <Link
                href={showArchived ? "/clients" : "/clients?archived=1"}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Archive className="h-3.5 w-3.5" />
                {showArchived ? "View active clients" : "View archived clients"}
              </Link>
            </div>
          </div>
          {!showArchived && (
            <Link href="/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </Link>
          )}
        </div>

        {/* Search & views */}
        <form method="get" action="/clients" className="flex flex-wrap items-center gap-4">
          {showArchived && <input type="hidden" name="archived" value="1" />}
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
              {showArchived ? (
                <Archive className="h-12 w-12" />
              ) : (
                <Plus className="h-12 w-12" />
              )}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {showArchived ? "No archived clients" : "No clients"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {showArchived
                ? "Archived clients appear here after you archive them from the list or dashboard."
                : "Get started by creating your first client."}
            </p>
            {!showArchived && (
              <div className="mt-6">
                <Link href="/clients/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}