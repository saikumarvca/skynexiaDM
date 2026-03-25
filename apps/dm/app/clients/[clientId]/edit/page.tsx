import Link from "next/link"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientForm } from "@/components/client-form"
import { Button } from "@/components/ui/button"
import { ClientFormData } from "@/types"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3152"

async function getClient(clientId: string) {
  const res = await fetch(`${BASE}/api/clients/${clientId}`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

async function updateClient(clientId: string, data: ClientFormData) {
  "use server"

  const res = await fetch(`${BASE}/api/clients/${clientId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update client")
  return res.json()
}

export default async function ClientEditPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const client = await getClient(clientId)
  if (!client) notFound()

  const initialData: ClientFormData = {
    name: client.name,
    businessName: client.businessName,
    brandName: client.brandName,
    contactName: client.contactName,
    phone: client.phone,
    email: client.email,
    notes: client.notes ?? "",
    status: client.status,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
            <p className="text-muted-foreground">
              Update client details and contact information.
            </p>
          </div>
          <Link href={`/clients/${clientId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>

        <div className="max-w-2xl">
          <ClientForm
            initialData={initialData}
            onSubmit={updateClient.bind(null, clientId)}
            redirectTo={`/clients/${clientId}`}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
