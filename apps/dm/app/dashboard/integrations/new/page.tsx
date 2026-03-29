import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard-layout";
import { NewIntegrationForm } from "./new-integration-form";
import { serverFetch } from "@/lib/server-fetch";

export const metadata: Metadata = {
  title: "New integration",
};

async function getClients(): Promise<{ _id: string; name: string }[]> {
  try {
    const res = await serverFetch("/api/clients?limit=500");
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((c: { _id: string; name?: string; businessName?: string }) => ({
      _id: String(c._id),
      name: c.name || c.businessName || "Unnamed client",
    }));
  } catch {
    return [];
  }
}

export default async function NewIntegrationPage() {
  const clients = await getClients();

  return (
    <DashboardLayout>
      <NewIntegrationForm clients={clients} />
    </DashboardLayout>
  );
}
