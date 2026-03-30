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
import { useAllocationsByDraftId } from "./review-draft-table/useAllocationsByDraftId";
import { useFloatingPanePosition } from "./review-draft-table/useFloatingPanePosition";
import type { ReviewDraftTableProps } from "./review-draft-table/types";
import { filterDraftsBySearch, getDraftClientName } from "./review-draft-table/draftSelectors";
import { useDraftsImport } from "./review-draft-table/useDraftsImport";
import { useDraftActivity } from "./review-draft-table/useDraftActivity";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const paneRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [paneOpen, setPaneOpen] = useState(false);
  const isLg = useMediaQuery("(min-width: 1024px)");
  const { activityDraft, activity, openActivity, closeActivity } =
    useDraftActivity();
  const { importLoading, handleImportFile } = useDraftsImport({
    selectedClientId,
    onImported: () => router.refresh(),
  });

  const draftIds = useMemo(() => drafts.map((d) => d._id), [drafts]);
  const allocationsByDraftId = useAllocationsByDraftId(draftIds);
  const { paneTop, computePaneTop } = useFloatingPanePosition({
    enabled: isLg && paneOpen,
    selectedDraftId,
    cardRefs,
    paneRef,
  });

  const filtered = useMemo(
    () => filterDraftsBySearch(drafts, search),
    [drafts, search],
  );

  const handleCopy = async (d: ReviewDraft) => {
    try {
      await navigator.clipboard.writeText(d.reviewText);
    } catch (e) {
      console.error(e);
    }
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
                clientName={getDraftClientName(d)}
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
                clientName={getDraftClientName(d)}
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
          closeActivity();
        }}
        activity={activity}
      />
    </div>
  );
}
