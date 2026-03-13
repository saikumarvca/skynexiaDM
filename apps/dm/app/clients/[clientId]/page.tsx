import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCard } from "@/components/stats-card"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, Archive, Edit, Plus } from "lucide-react"
import Link from "next/link"
import { Client } from "@/types"

async function getClient(clientId: string): Promise<Client | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clients/${clientId}`, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Error fetching client:', error)
    return null
  }
}

async function getClientStats(clientId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clients/${clientId}/stats`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return {
      totalReviews: 0,
      unusedReviews: 0,
      usedReviews: 0,
      totalUsage: 0,
    }
  }
}

interface ClientDetailPageProps {
  params: { clientId: string }
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const client = await getClient(params.clientId)
  const stats = await getClientStats(params.clientId)

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Client not found</h1>
          <p className="text-muted-foreground">The client you're looking for doesn't exist.</p>
          <Link href="/clients">
            <Button className="mt-4">Back to Clients</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">{client.businessName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={client.status} />
            <Link href={`/clients/${client._id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Reviews"
            value={stats.totalReviews}
            icon={FileText}
            description="All reviews"
          />
          <StatsCard
            title="Unused Reviews"
            value={stats.unusedReviews}
            icon={CheckCircle}
            description="Available for use"
          />
          <StatsCard
            title="Used Reviews"
            value={stats.usedReviews}
            icon={Archive}
            description="Already utilized"
          />
          <StatsCard
            title="Total Usage"
            value={stats.totalUsage}
            icon={FileText}
            description="Usage records"
          />
        </div>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Business Name</label>
                <p className="mt-1">{client.businessName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Brand Name</label>
                <p className="mt-1">{client.brandName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                <p className="mt-1">{client.contactName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="mt-1">{client.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1">{client.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <StatusBadge status={client.status} />
                </div>
              </div>
              {client.notes && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1">{client.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="reviews" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Reviews</h2>
              <div className="flex space-x-2">
                <Link href={`/clients/${client._id}/reviews/new`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Review
                  </Button>
                </Link>
                <Link href={`/clients/${client._id}/reviews/bulk`}>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Bulk Import
                  </Button>
                </Link>
              </div>
            </div>
            <Link href={`/clients/${client._id}/reviews`}>
              <Button variant="outline">View All Reviews</Button>
            </Link>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <h2 className="text-xl font-semibold">Usage History</h2>
            <p className="text-muted-foreground">Review usage tracking will be displayed here.</p>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-xl font-semibold">Client Settings</h2>
            <p className="text-muted-foreground">Client configuration options will be available here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}