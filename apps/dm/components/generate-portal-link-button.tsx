"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

interface GeneratePortalLinkButtonProps {
  clientId: string;
}

export function GeneratePortalLinkButton({
  clientId,
}: GeneratePortalLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate link");
      }
      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.url}`;
      setPortalUrl(fullUrl);
      await navigator.clipboard.writeText(fullUrl).catch(() => {});
      toast.success("Portal link copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate portal link",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleGenerate} disabled={loading}>
        <Link2 className="mr-2 h-4 w-4" />
        {loading ? "Generating..." : "Portal Link"}
      </Button>
      {portalUrl && (
        <span className="max-w-xs truncate rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          {portalUrl}
        </span>
      )}
    </div>
  );
}
