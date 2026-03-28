"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ArchiveClientButton } from "@/components/archive-client-button"
import { UnarchiveClientButton } from "@/components/unarchive-client-button"
import { Client } from "@/types"

interface ClientCardProps {
  client: Client
}

export function ClientCard({ client }: ClientCardProps) {
  const href = `/clients/${client._id}`
  const canArchive = client.status !== "ARCHIVED"

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0 flex-1 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <CardTitle className="text-lg leading-snug hover:text-primary">{client.name}</CardTitle>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge status={client.status} />
            {client.status === "ARCHIVED" ? (
              <UnarchiveClientButton clientId={client._id} clientName={client.name} />
            ) : (
              canArchive && (
                <ArchiveClientButton clientId={client._id} clientName={client.name} />
              )
            )}
          </div>
        </div>
      </CardHeader>
      <Link href={href} className="block rounded-b-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        <CardContent className="cursor-pointer pt-0 hover:bg-muted/40">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Business: {client.businessName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Contact: {client.contactName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email: {client.email}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Phone: {client.phone}
            </p>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
