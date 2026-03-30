"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ReviewDraftForm } from "./review-draft-form";
import { AssignDraftModal } from "./assign-draft-modal";
import { ReviewActivityTimeline } from "./review-activity-timeline";
import { ReviewDraftDetailsPane } from "./review-draft-details-pane";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ReviewDraft } from "@/types/reviews";
import { ReviewDraftTableToolbar } from "./review-draft-table/Toolbar";
import { DraftCard } from "./review-draft-table/DraftCard";
import { parseDraftsCSV } from "./review-draft-table/utils";
import { useAllocationsByDraftId } from "./review-draft-table/useAllocationsByDraftId";
import { useFloatingPanePosition } from "./review-draft-table/useFloatingPanePosition";
import type { ReviewDraftTableProps } from "./review-draft-table/types";

export function ReviewDraftTable({
  drafts,
  clients,
  users,
  selectedClientId,
  onCreate,
  onUpdate,
  onDuplicate,
  onAssign,
  onArchive,
}: ReviewDraftTableProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"row" | "grid">("row");
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const selectedDraft = drafts.find((d) => d._id === selectedDraftId) ?? null;
  const [formOpen, setFormOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ReviewDraft | null>(null);
  const [assignDraft, setAssignDraft] = useState<ReviewDraft | null>(null);
  const [activityDraft, setActivityDraft] = useState<ReviewDraft | null>(null);
  const [activity, setActivity] = useState<
    { action: string; performedBy: string; performedAt: string }[]
  >([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const paneRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [paneOpen, setPaneOpen] = useState(false);
  const isLg = useMediaQuery("(min-width: 1024px)");

  const draftIds = useMemo(() => drafts.map((d) => d._id), [drafts]);
  const allocationsByDraftId = useAllocationsByDraftId(draftIds);
  const { paneTop, computePaneTop } = useFloatingPanePosition({
    enabled: isLg && paneOpen,
    selectedDraftId,
    cardRefs,
    paneRef,
  });

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = parseDraftsCSV(text);
        if (parsed.length === 0) {
          toast.error(
            "No valid rows found. CSV needs subject and reviewText (or review text), plus optional columns.",
          );
          return;
        }
        const res = await fetch(`/api/review-drafts/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drafts: parsed,
            clientId:
              selectedClientId && selectedClientId !== "ALL"
                ? selectedClientId
                : undefined,
            createdBy: "system",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Import failed");
        toast.success("Drafts imported");
        router.refresh();
        e.target.value = "";
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Import failed. Check CSV columns and that at least one client exists.",
        );
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const filtered = drafts.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (d.subject ?? "").toLowerCase().includes(s) ||
      (d.reviewText ?? "").toLowerCase().includes(s) ||
      (d.clientName ?? "").toLowerCase().includes(s) ||
      (d.category ?? "").toLowerCase().includes(s)
    );
  });

  const clientName = (d: ReviewDraft) => {
    const c = d.clientId;
    if (typeof c === "object" && c && "businessName" in c)
      return (c as { businessName?: string }).businessName ?? "—";
    return d.clientName ?? "—";
  };

  const handleCopy = async (d: ReviewDraft) => {
    try {
      await navigator.clipboard.writeText(d.reviewText);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchActivity = async (entityType: string, entityId: string) => {
    const res = await fetch(
      `/api/review-activity?entityType=${entityType}&entityId=${entityId}`,
    );
    if (!res.ok) return [];
    return res.json();
  };

  const openActivity = async (d: ReviewDraft) => {
    setActivityDraft(d);
    const logs = await handleFetchActivity("DRAFT", d._id);
    setActivity(logs);
  };

  const closeDetailsPane = () => {
    setPaneOpen(false);
    setSelectedDraftId(null);
  };

  const handleRowClick = (d: ReviewDraft) => {
    setSelectedDraftId(d._id);
    setPaneOpen(true);
    requestAnimationFrame(() => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 1024px)").matches
      ) {
        computePaneTop(d._id);
      }
    });
  };

  const handleArchiveClick = async (d: ReviewDraft) => {
    if (!confirm("Archive this draft?")) return;
    try {
      await onArchive(d._id);
      toast.success("Draft archived");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to archive draft");
    }
  };

  const renderDraftDetailsPane = () => (
    <ReviewDraftDetailsPane
      draft={selectedDraft}
      clients={clients}
      users={users}
      assignedToName={
        selectedDraftId ? allocationsByDraftId[selectedDraftId] : undefined
      }
      onClose={closeDetailsPane}
      onEdit={(draft) => {
        setEditDraft(draft);
        setFormOpen(true);
      }}
      onDuplicate={async (id) => {
        try {
          await onDuplicate(id);
          toast.success("Draft duplicated");
          router.refresh();
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Failed to duplicate draft",
          );
        }
      }}
      onCopy={handleCopy}
      onAssign={(draft) => setAssignDraft(draft)}
      onArchive={handleArchiveClick}
      onViewHistory={openActivity}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <ReviewDraftTableToolbar
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          importLoading={importLoading}
          fileInputRef={fileInputRef}
          onCreateClick={() => {
            setEditDraft(null);
            setFormOpen(true);
          }}
          onExportClick={() => window.open(`/api/review-drafts/export`, "_blank")}
          onImportPickClick={() => fileInputRef.current?.click()}
          onImportFileChange={handleImportFile}
        />

        {viewMode === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <DraftCard
                key={d._id}
                draft={d}
                mode="grid"
                selected={selectedDraftId === d._id}
                assignedToName={allocationsByDraftId[d._id]}
                canArchive={d.status !== "Archived"}
                clientName={clientName(d)}
                onArchiveClick={() => handleArchiveClick(d)}
                onOpen={() => handleRowClick(d)}
                onRef={(el) => {
                  cardRefs.current[d._id] = el;
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <DraftCard
                key={d._id}
                draft={d}
                mode="row"
                selected={selectedDraftId === d._id}
                assignedToName={allocationsByDraftId[d._id]}
                canArchive={d.status !== "Archived"}
                clientName={clientName(d)}
                onArchiveClick={() => handleArchiveClick(d)}
                onOpen={() => handleRowClick(d)}
                onRef={(el) => {
                  cardRefs.current[d._id] = el;
                }}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No drafts found.
          </p>
        )}
      </div>

      <Sheet
        open={!isLg && paneOpen && !!selectedDraftId}
        onOpenChange={(open) => {
          if (!open) closeDetailsPane();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex w-full flex-col gap-0 border-l p-0 sm:max-w-lg"
        >
          <SheetTitle className="sr-only">Review draft details</SheetTitle>
          <SheetDescription className="sr-only">
            Subject, review text, and actions for this draft.
          </SheetDescription>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {renderDraftDetailsPane()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating details pane aligned to selected card (large viewports only) */}
      <div
        ref={paneRef}
        className={cn(
          "hidden lg:block fixed right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)]",
          "rounded-lg border bg-background shadow-xl",
          "transition-transform duration-200 ease-out",
          paneOpen && selectedDraftId ? "translate-x-0" : "translate-x-[460px]",
        )}
        style={{ top: paneTop }}
      >
        <div className="h-[520px] overflow-hidden">
          {renderDraftDetailsPane()}
        </div>
      </div>

      <ReviewDraftForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditDraft(null);
        }}
        onSubmit={async (data) => {
          try {
            if (editDraft) {
              await onUpdate(editDraft._id, data);
              toast.success("Changes saved");
            } else {
              await onCreate(data);
              toast.success("Draft created");
            }
            router.refresh();
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Could not save draft",
            );
            throw e;
          }
        }}
        clients={clients}
        draft={editDraft}
      />

      <AssignDraftModal
        isOpen={!!assignDraft}
        onClose={() => setAssignDraft(null)}
        onSubmit={async (data) => {
          if (!assignDraft) return;
          try {
            await onAssign(assignDraft._id, data);
            toast.success("Draft assigned");
            router.refresh();
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Could not assign draft",
            );
            throw e;
          }
        }}
        draft={assignDraft}
        users={users}
        assignedByUserId={users[0]?._id ?? ""}
        assignedByUserName={users[0]?.name ?? "system"}
        isNonReusableUsed={
          assignDraft
            ? !assignDraft.reusable && assignDraft.status === "Used"
            : false
        }
      />

      <ReviewActivityTimeline
        isOpen={!!activityDraft}
        onClose={() => {
          setActivityDraft(null);
          setActivity([]);
        }}
        activity={activity}
      />
    </div>
  );
}
