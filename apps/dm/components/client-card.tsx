import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Client } from "@/types"

interface ClientCardProps {
  client: Client
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Link href={`/clients/${client._id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{client.name}</CardTitle>
            <StatusBadge status={client.status} />
          </div>
        </CardHeader>
        <CardContent>
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
      </Card>
    </Link>
  )
}