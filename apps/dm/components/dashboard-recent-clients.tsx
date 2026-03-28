"use client"

import Link from "next/link"
import { ArchiveClientButton } from "@/components/archive-client-button"

export type RecentClientRow = {
  _id: string
  name: string
  businessName: string
  createdAt: string
}

interface DashboardRecentClientsProps {
  clients: RecentClientRow[]
}

export function DashboardRecentClients({ clients }: DashboardRecentClientsProps) {
  if (clients.length === 0) {
    return <p className="text-muted-foreground">No clients yet.</p>
  }

  return (
    <div className="space-y-4">
      {clients.map((client) => (
        <div key={client._id} className="flex items-center justify-between gap-3">
          <Link
            href={`/clients/${client._id}`}
            className="min-w-0 flex-1 rounded-md outline-none ring-offset-background hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="font-medium">{client.name}</p>
            <p className="text-sm text-muted-foreground">{client.businessName}</p>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {new Date(client.createdAt).toLocaleDateString()}
            </span>
            <ArchiveClientButton clientId={client._id} clientName={client.name} />
          </div>
        </div>
      ))}
    </div>
  )
}
