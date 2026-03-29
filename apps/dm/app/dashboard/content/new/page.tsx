import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ContentForm } from "@/components/content-form";

import { serverFetch } from "@/lib/server-fetch";

async function getClients() {
  try {
    const res = await serverFetch("/api/clients?limit=500");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const clients = await getClients();

  async function createContent(formData: FormData) {
    "use server";
    const clientId = formData.get("clientId") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    if (!clientId || !title || !content || !category) {
      throw new Error("Client, title, content, and category are required");
    }
    const tagsRaw = (formData.get("tags") as string) || "";
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;
    const res = await serverFetch("/api/content-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title,
        content,
        category,
        platform: (formData.get("platform") as string) || undefined,
        status: (formData.get("status") as string) || "DRAFT",
        source: (formData.get("source") as string) || "MANUAL",
        tags,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create content");
    }
    redirect("/dashboard/content?created=1");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New content</h1>
            <p className="text-muted-foreground">
              Add a caption, hashtags, ad copy, CTA, or hook to the content
              bank.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <ContentForm
            clients={clients}
            action={createContent}
            defaultClientId={params.clientId}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
