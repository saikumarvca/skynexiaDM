"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleStatsProps {
  children: React.ReactNode;
  label?: string;
}

export function CollapsibleStats({
  children,
  label = "Stats",
}: CollapsibleStatsProps) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {open ? `Hide ${label}` : `Show ${label}`}
      </button>
      {open && children}
    </div>
  );
}
