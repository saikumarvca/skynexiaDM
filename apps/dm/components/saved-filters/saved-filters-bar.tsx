"use client";

import { useState, useEffect, useRef } from "react";
import { Bookmark, X, Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SavedFilter {
  _id: string;
  name: string;
  entityType: string;
  filters: Record<string, string>;
}

interface SavedFiltersBarProps {
  entityType: "lead" | "task" | "content";
  currentFilters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
}

export function SavedFiltersBar({ entityType, currentFilters, onApply }: SavedFiltersBarProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [filterName, setFilterName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFilters();
  }, [entityType]);

  useEffect(() => {
    if (showNameInput) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [showNameInput]);

  async function fetchFilters() {
    setLoading(true);
    try {
      const res = await fetch(`/api/saved-filters?entityType=${entityType}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSavedFilters(data);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentFilters() {
    const name = filterName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, entityType, filters: currentFilters }),
      });
      if (res.ok) {
        const created = await res.json();
        setSavedFilters((prev) => [created, ...prev]);
        setShowNameInput(false);
        setFilterName("");
      }
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
    }
  }

  async function deleteFilter(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(id);
    try {
      const res = await fetch(`/api/saved-filters/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSavedFilters((prev) => prev.filter((f) => f._id !== id));
      }
    } catch {
      // silently ignore
    } finally {
      setDeleting(null);
    }
  }

  const hasActiveFilters = Object.values(currentFilters).some(
    (v) => v && v !== "ALL" && v !== ""
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 shrink-0">
        <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Saved filters</span>
      </div>

      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <>
          {savedFilters.length === 0 && !showNameInput && (
            <span className="text-xs text-muted-foreground/60">No saved filters yet</span>
          )}

          {savedFilters.map((sf) => (
            <button
              key={sf._id}
              onClick={() => onApply(sf.filters)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              {sf.name}
              <span
                role="button"
                aria-label={`Delete ${sf.name}`}
                onClick={(e) => deleteFilter(sf._id, e)}
                className="flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive"
              >
                {deleting === sf._id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </span>
            </button>
          ))}

          {showNameInput ? (
            <div className="flex items-center gap-1.5">
              <Input
                ref={nameInputRef}
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveCurrentFilters();
                  if (e.key === "Escape") {
                    setShowNameInput(false);
                    setFilterName("");
                  }
                }}
                placeholder="Filter name…"
                className="h-7 w-36 text-xs px-2"
              />
              <Button
                size="sm"
                variant="default"
                className="h-7 px-2 text-xs"
                disabled={saving || !filterName.trim()}
                onClick={saveCurrentFilters}
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setShowNameInput(false);
                  setFilterName("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setShowNameInput(true)}
              >
                <Plus className="h-3 w-3" />
                Save current filters
              </Button>
            )
          )}
        </>
      )}
    </div>
  );
}
