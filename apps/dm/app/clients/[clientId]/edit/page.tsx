import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ClientForm } from "@/components/client-form";
import { Button } from "@/components/ui/button";
import { ClientFormData } from "@/types";
import { getActiveTeamManagers } from "@/lib/team-managers";

import { serverFetch } from "@/lib/server-fetch";
import { errorMessageFromResponse } from "@/lib/server-fetch";

function toIsoDay(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v.slice(0, 10);
  const d = new Date(v as string | number | Date);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

async function getClient(clientId: string) {
  const res = await serverFetch(`/api/clients/${clientId}`);
  if (!res.ok) return null;
  return await res.json();
}

async function updateClient(clientId: string, data: ClientFormData) {
  "use server";

  const res = await serverFetch(`/api/clients/${clientId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(
      await errorMessageFromResponse(res, "Failed to update client"),
    );
  }
  return await res.json();
}

export default async function ClientEditPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const [client, managers] = await Promise.all([
    getClient(clientId),
    getActiveTeamManagers(),
  ]);
  if (!client) notFound();

  const initialData: ClientFormData = {
    name: client.name,
    businessName: client.businessName,
    brandName: client.brandName,
    contactName: client.contactName,
    phone: client.phone,
    email: client.email,
    notes: client.notes ?? "",
    status: client.status,
    website: client.website,
    industry: client.industry,
    location: client.location,
    marketingChannels: client.marketingChannels ?? [],
    contractStart: toIsoDay(client.contractStart),
    contractEnd: toIsoDay(client.contractEnd),
    monthlyBudget: client.monthlyBudget ?? null,
    assignedManagerId: client.assignedManagerId ?? null,
    reviewDestinationUrl: client.reviewDestinationUrl ?? "",
    reviewQrImageUrl: client.reviewQrImageUrl ?? "",
    reviewDestinations: client.reviewDestinations ?? [],
  };

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

        <div className="max-w-4xl">
          <ClientForm
            initialData={initialData}
            managers={managers}
            onSubmit={updateClient.bind(null, clientId)}
            redirectTo={`/clients/${clientId}`}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
