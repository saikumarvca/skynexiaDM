"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutList, Columns3 } from "lucide-react";
import { Lead, Client } from "@/types";
import { LeadKanban } from "./lead-kanban";
import { SavedFiltersBar } from "@/components/saved-filters/saved-filters-bar";

const STORAGE_KEY = "dm-leads-view";
type View = "table" | "kanban";

interface LeadsPageClientProps {
  leads: Lead[];
  clients: Client[];
  tableContent: React.ReactNode;
}

export function LeadsPageClient({
  leads,
  clients,
  tableContent,
}: LeadsPageClientProps) {
  const [view, setView] = useState<View>("table");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL param takes priority over localStorage (e.g. nav link ?view=kanban)
    const urlView = searchParams.get("view");
    if (urlView === "kanban" || urlView === "table") {
      setView(urlView);
      localStorage.setItem(STORAGE_KEY, urlView);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "kanban" || saved === "table") {
        setView(saved);
      }
    }
    setMounted(true);
  }, []);

  function switchView(v: View) {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  const currentFilters: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    currentFilters[key] = value;
  });

  function applyFilters(filters: Record<string, string>) {
    const params = new URLSearchParams(filters);
    router.push(`/dashboard/leads?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Saved filters bar */}
      <SavedFiltersBar
        entityType="lead"
        currentFilters={currentFilters}
        onApply={applyFilters}
      />

      {/* View toggle */}
      <div className="flex justify-end">
        <div
          className="inline-flex rounded-md border bg-background shadow-sm"
          role="group"
        >
          <button
            onClick={() => switchView("table")}
            className={`inline-flex items-center gap-1.5 rounded-l-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
              view === "table"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <LayoutList className="h-4 w-4" />
            Table
          </button>
          <button
            onClick={() => switchView("kanban")}
            className={`inline-flex items-center gap-1.5 rounded-r-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
              view === "kanban"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Columns3 className="h-4 w-4" />
            Kanban
          </button>
        </div>
      </div>

      {/* View content */}
      {!mounted || view === "table" ? (
        tableContent
      ) : (
        <LeadKanban leads={leads} clients={clients} />
      )}
    </div>
  );
}
