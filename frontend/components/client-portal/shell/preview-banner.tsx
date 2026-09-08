"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown to internal users while they preview the portal as a client. */
export function PreviewBanner({
  clientName,
  actorName,
}: {
  clientName: string;
  actorName: string;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const exit = async () => {
    setLeaving(true);
    try {
      const res = await fetch("/api/client/preview/exit", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { redirectTo?: string };
      router.replace(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      router.replace("/dashboard");
    }
  };

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-100 sm:px-6"
    >
      <span className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">Preview mode.</strong> You ({actorName}) are viewing
          the portal exactly as <strong className="font-semibold">{clientName}</strong> sees it.
          Read-only.
        </span>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-8 border-amber-400 bg-white text-amber-900 hover:bg-amber-100 dark:bg-transparent dark:text-amber-100"
        onClick={() => void exit()}
        disabled={leaving}
      >
        <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        {leaving ? "Leaving…" : "Exit preview"}
      </Button>
    </div>
  );
}
