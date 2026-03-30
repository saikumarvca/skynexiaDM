"use client";

import React from "react";
import { LayoutGrid, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewDraftTableToolbar(props: {
  search: string;
  onSearchChange: (next: string) => void;
  viewMode: "row" | "grid";
  onViewModeChange: (next: "row" | "grid") => void;
  importLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onCreateClick: () => void;
  onExportClick: () => void;
  onImportPickClick: () => void;
  onImportFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCount: number;
  onBulkAssignClientClick: () => void;
  onBulkAssignUserClick: () => void;
}) {
  const {
    search,
    onSearchChange,
    viewMode,
    onViewModeChange,
    importLoading,
    fileInputRef,
    onCreateClick,
    onExportClick,
    onImportPickClick,
    onImportFileChange,
    selectedCount,
    onBulkAssignClientClick,
    onBulkAssignUserClick,
  } = props;

  return (
    <div className="mb-4 flex flex-wrap gap-4">
      <Input
        placeholder="Search subject, text, client, category..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <div className="inline-flex rounded-md border bg-background p-1">
        <Button
          type="button"
          variant={viewMode === "row" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          onClick={() => onViewModeChange("row")}
        >
          <Rows3 className="mr-1 h-4 w-4" />
          Row
        </Button>
        <Button
          type="button"
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="mr-1 h-4 w-4" />
          Grid
        </Button>
      </div>
      <Button onClick={onCreateClick}>Create Draft</Button>
      <Button variant="outline" onClick={onExportClick}>
        Export CSV
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onImportFileChange}
      />
      <Button
        variant="outline"
        disabled={importLoading}
        onClick={onImportPickClick}
      >
        {importLoading ? "Importing…" : "Import"}
      </Button>
      <details className="relative">
        <summary className="inline-flex h-10 cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Import format
        </summary>
        <div
          role="tooltip"
          aria-label="CSV import format help"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-[340px] max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md"
        >
          <p className="font-medium">CSV format</p>
          <p className="mt-2">
            Required: <code>subject</code>, <code>reviewText</code> (or{" "}
            <code>review text</code>)
          </p>
          <p className="mt-1">
            Optional: <code>category</code>, <code>language</code>,{" "}
            <code>suggestedRating</code> (or <code>rating</code>,{" "}
            <code>suggested rating</code>)
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Example header:
          </p>
          <p className="mt-1 text-xs text-muted-foreground break-words">
            subject,reviewText,category,language,suggestedRating
          </p>
        </div>
      </details>
      <Button
        variant="outline"
        disabled={selectedCount === 0}
        onClick={onBulkAssignClientClick}
      >
        Assign Client ({selectedCount})
      </Button>
      <Button
        variant="outline"
        disabled={selectedCount === 0}
        onClick={onBulkAssignUserClick}
      >
        Assign User ({selectedCount})
      </Button>
    </div>
  );
}

