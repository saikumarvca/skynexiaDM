"use client"

import Link from "next/link"
import { ArchiveClientButton } from "@/components/archive-client-button"
import { cn } from "@/lib/utils"

function initials(name: string, business: string) {
  const n = name.trim()
  if (n.length >= 2) return n.slice(0, 2).toUpperCase()
  const b = business.trim()
  if (b.length >= 2) return b.slice(0, 2).toUpperCase()
  return "?"
}

const avatarHues = [200, 168, 265, 22, 340, 199] as const

function avatarStyle(index: number) {
  const h = avatarHues[index % avatarHues.length] ?? 200
  return {
    background: `linear-gradient(135deg, hsl(${h} 55% 42%), hsl(${(h + 40) % 360} 60% 36%))`,
  } as const
}

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
    <div className="space-y-1">
      {clients.map((client, i) => (
        <div
          key={client._id}
          className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2.5 transition-colors hover:border-border/80 hover:bg-muted/40"
        >
          <Link
            href={`/clients/${client._id}`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm"
              )}
              style={avatarStyle(i)}
              aria-hidden
            >
              {initials(client.name, client.businessName)}
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-foreground transition-colors hover:text-primary">
                {client.name}
              </span>
              <span className="block truncate text-sm text-muted-foreground">{client.businessName}</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline sm:text-sm">
              {new Date(client.createdAt).toLocaleDateString()}
            </span>
            <ArchiveClientButton clientId={client._id} clientName={client.name} />
          </div>
        </div>
      ))}
    </div>
  )
}
