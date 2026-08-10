"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SeedDataButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    setLoading(true);
    try {
      const res = await fetch(`/api/team/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(
        "Seed failed. Team data may already exist. Use force: true to reseed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleSeed} disabled={loading}>
      {loading ? "Seeding..." : "Seed Demo Data"}
    </Button>
  );
}
