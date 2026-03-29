"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type SeedButtonProps = {
  endpoint: string;
  label?: string;
  forceLabel?: string;
  force?: boolean;
  className?: string;
};

export function SeedButton({
  endpoint,
  label = "Seed demo data",
  forceLabel = "Reseed (force)",
  force = false,
  className,
}: SeedButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(force ? { force: true } : {}),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Seed failed");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Seed failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleSeed} disabled={loading}>
          {loading ? "Seeding..." : force ? forceLabel : label}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
