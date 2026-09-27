"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** POST /api/client/profile/sessions/revoke — signs out every other device. */
export function SignOutEverywhereButton({ disabled = false }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);

  const revoke = async () => {
    if (!window.confirm("Sign out of the portal on every other device?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/client/profile/sessions/revoke", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not sign out other devices");
      toast.success("Other devices have been signed out. You stay signed in here.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign out other devices");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={revoke} disabled={disabled || loading}>
      <LogOut className="mr-2 h-4 w-4" aria-hidden />
      Sign out other devices
    </Button>
  );
}
