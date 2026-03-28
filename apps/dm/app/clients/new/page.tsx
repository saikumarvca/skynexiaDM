import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientForm } from "@/components/client-form"
import { ClientFormData } from "@/types"
import { serverFetch } from "@/lib/server-fetch"

async function createClient(data: ClientFormData) {
  'use server'

  const res = await serverFetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error('Failed to create client')
  }

  return res.json()
}

export default function NewClientPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Client</h1>
          <p className="text-muted-foreground">
            Create a new client account to manage their reviews.
          </p>
        </div>

        <div className="max-w-2xl">
          <ClientForm onSubmit={createClient} />
        </div>
      </div>
    </DashboardLayout>
  )
}