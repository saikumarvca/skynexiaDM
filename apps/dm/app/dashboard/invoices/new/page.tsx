import { DashboardLayout } from "@/components/dashboard-layout";
import { NewInvoiceForm } from "./new-invoice-form";
import { serverFetch } from "@/lib/server-fetch";
import type { Client, ItemMaster } from "@/types";

async function getClients(): Promise<Client[]> {
  try {
    const res = await serverFetch("/api/clients?limit=500");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getItemMasters(): Promise<ItemMaster[]> {
  try {
    const res = await serverFetch("/api/item-master");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [clients, itemMasters] = await Promise.all([
    getClients(),
    getItemMasters(),
  ]);
  return (
    <DashboardLayout>
      <NewInvoiceForm
        clients={clients}
        itemMasters={itemMasters}
        defaultClientId={params.clientId}
      />
    </DashboardLayout>
  );
}
