"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  onReassignClients,
  onArchive,
}: ReviewDraftTableProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"row" | "grid">("row");
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const selectedDraft = useMemo(
    () => drafts.find((d) => d._id === selectedDraftId) ?? null,
    [drafts, selectedDraftId],
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ReviewDraft | null>(null);
  const [assignDraft, setAssignDraft] = useState<ReviewDraft | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const paneRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [paneOpen, setPaneOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignSubmitting, setReassignSubmitting] = useState(false);
  const [bulkAssignUserOpen, setBulkAssignUserOpen] = useState(false);
  const [bulkAssignUserSubmitting, setBulkAssignUserSubmitting] = useState(false);
  const [bulkAssignedToUserId, setBulkAssignedToUserId] = useState("");
  const [bulkCustomerName, setBulkCustomerName] = useState("");
  const [bulkCustomerContact, setBulkCustomerContact] = useState("");
  const [bulkPlatform, setBulkPlatform] = useState("");
  const [targetClientByDraftId, setTargetClientByDraftId] = useState<
    Record<string, string>
  >({});
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
  const selectableDrafts = useMemo(
    () => filtered.filter((d) => d.status === "Available"),
    [filtered],
  );

  const assignableClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          (c.businessName ?? "").trim().toLowerCase() !== "unassigned" &&
          (c.name ?? "").trim().toLowerCase() !== "unassigned",
      ),
    [clients],
  );

  const handleCopy = useCallback(async (d: ReviewDraft) => {
    try {
      await navigator.clipboard.writeText(d.reviewText);
      toast.success("Copied to clipboard");
    } catch (e) {
      console.error(e);
      toast.error("Could not copy to clipboard");
    }
  }, []);

  const closeDetailsPane = useCallback(() => {
    setPaneOpen(false);
    setSelectedDraftId(null);
  }, []);

  const handleRowClick = useCallback((d: ReviewDraft) => {
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
  }, [computePaneTop]);

  const handleArchiveClick = useCallback(async (d: ReviewDraft) => {
    if (!confirm("Archive this draft?")) return;
    try {
      await onArchive(d._id);
      toast.success("Draft archived");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to archive draft");
    }
  }, [onArchive, router]);

  const handleEdit = useCallback((draft: ReviewDraft) => {
    setEditDraft(draft);
    setFormOpen(true);
  }, []);

  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        await onDuplicate(id);
        toast.success("Draft duplicated");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to duplicate draft");
      }
    },
    [onDuplicate, router],
  );

  const handleAssign = useCallback((draft: ReviewDraft) => {
    setAssignDraft(draft);
  }, []);

  const openBulkAssignUser = useCallback(() => {
    if (selectedIds.length === 0) return;
    setBulkAssignedToUserId((prev) => prev || users[0]?._id || "");
    setBulkAssignUserOpen(true);
  }, [selectedIds.length, users]);

  const toggleSelectedDraft = useCallback((draftId: string, next: boolean) => {
    setSelectedIds((prev) =>
      next ? Array.from(new Set([...prev, draftId])) : prev.filter((id) => id !== draftId),
    );
  }, []);

  const openBulkReassign = useCallback(() => {
    if (selectedIds.length === 0) return;
    setTargetClientByDraftId((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const draftId of selectedIds) {
        if (!next[draftId]) next[draftId] = assignableClients[0]?._id ?? "";
      }
      return next;
    });
    setReassignOpen(true);
  }, [assignableClients, selectedIds]);

  const submitBulkReassign = useCallback(async () => {
    const items = selectedIds
      .map((draftId) => ({
        draftId,
        clientId: targetClientByDraftId[draftId] ?? "",
      }))
      .filter((x) => x.clientId);
    if (items.length === 0) {
      toast.error("Pick target client for at least one draft");
      return;
    }
    setReassignSubmitting(true);
    try {
      const result = await onReassignClients(items);
      toast.success(
        `Client reassignment done: ${result.successCount} success, ${result.failedCount} failed`,
      );
      setReassignOpen(false);
      setSelectedIds([]);
      router.refresh();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to reassign selected drafts",
      );
    } finally {
      setReassignSubmitting(false);
    }
  }, [onReassignClients, router, selectedIds, targetClientByDraftId]);

  const submitBulkAssignUser = useCallback(async () => {
    if (!bulkAssignedToUserId) {
      toast.error("Select a user to assign");
      return;
    }
    const selectedUser = users.find((u) => u._id === bulkAssignedToUserId);
    if (!selectedUser) {
      toast.error("Selected user not found");
      return;
    }
    const selectedDrafts = drafts.filter((d) => selectedIds.includes(d._id));
    if (selectedDrafts.length === 0) {
      toast.error("No drafts selected");
      return;
    }
    setBulkAssignUserSubmitting(true);
    try {
      const results = await Promise.allSettled(
        selectedDrafts.map((draft) =>
          onAssign(draft._id, {
            draftId: draft._id,
            assignedToUserId: selectedUser._id,
            assignedToUserName: selectedUser.name,
            assignedByUserId: users[0]?._id ?? "",
            assignedByUserName: users[0]?.name ?? "system",
            customerName: bulkCustomerName.trim() || undefined,
            customerContact: bulkCustomerContact.trim() || undefined,
            platform: bulkPlatform || undefined,
          }),
        ),
      );
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failedCount = results.length - successCount;
      toast.success(
        `User assignment done: ${successCount} success, ${failedCount} failed`,
      );
      setBulkAssignUserOpen(false);
      setSelectedIds([]);
      setBulkCustomerName("");
      setBulkCustomerContact("");
      setBulkPlatform("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk assign failed");
    } finally {
      setBulkAssignUserSubmitting(false);
    }
  }, [
    bulkAssignedToUserId,
    bulkCustomerContact,
    bulkCustomerName,
    bulkPlatform,
    drafts,
    onAssign,
    router,
    selectedIds,
    users,
  ]);

  const assignedToName = useMemo(() => {
    if (!selectedDraftId) return undefined;
    return allocationsByDraftId[selectedDraftId];
  }, [allocationsByDraftId, selectedDraftId]);

  const renderDraftDetailsPane = useCallback(
    () => (
      <ReviewDraftDetailsPane
        draft={selectedDraft}
        clients={clients}
        users={users}
        assignedToName={assignedToName}
        onClose={closeDetailsPane}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onCopy={handleCopy}
        onAssign={handleAssign}
        onArchive={handleArchiveClick}
        onViewHistory={openActivity}
      />
    ),
    [
      assignedToName,
      clients,
      closeDetailsPane,
      handleArchiveClick,
      handleAssign,
      handleCopy,
      handleDuplicate,
      handleEdit,
      openActivity,
      selectedDraft,
      users,
    ],
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
            onExportClick={() =>
              window.open(`/api/review-drafts/export`, "_blank", "noopener,noreferrer")
            }
          onImportPickClick={() => fileInputRef.current?.click()}
          onImportFileChange={handleImportFile}
          selectedCount={selectedIds.length}
          onBulkAssignClientClick={openBulkReassign}
          onBulkAssignUserClick={openBulkAssignUser}
        />

        <div className="mb-3 flex items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={
                selectableDrafts.length > 0 &&
                selectableDrafts.every((d) => selectedIds.includes(d._id))
              }
              onChange={(e) =>
                setSelectedIds(
                  e.target.checked ? selectableDrafts.map((d) => d._id) : [],
                )
              }
            />
            Select all available in view
          </label>
          {selectedIds.length > 0 ? (
            <span className="text-muted-foreground">{selectedIds.length} selected</span>
          ) : null}
        </div>

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
                selectedForBulk={selectedIds.includes(d._id)}
                canSelectForBulk={d.status === "Available"}
                onBulkSelectChange={(next: boolean) =>
                  toggleSelectedDraft(d._id, next)
                }
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
                selectedForBulk={selectedIds.includes(d._id)}
                canSelectForBulk={d.status === "Available"}
                onBulkSelectChange={(next: boolean) =>
                  toggleSelectedDraft(d._id, next)
                }
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

      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Client to Selected Drafts</DialogTitle>
            <DialogDescription>
              Choose a target client for each selected draft. Only available drafts can be reassigned.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
            {selectedIds.map((id) => {
              const draft = drafts.find((d) => d._id === id);
              if (!draft) return null;
              return (
                <div key={id} className="rounded-md border p-3">
                  <p className="truncate text-sm font-medium" title={draft.subject}>
                    {draft.subject}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current client: {getDraftClientName(draft)}
                  </p>
                  <select
                    className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={targetClientByDraftId[id] ?? ""}
                    onChange={(e) =>
                      setTargetClientByDraftId((prev) => ({
                        ...prev,
                        [id]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select target client</option>
                    {assignableClients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.businessName}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)}>
              Cancel
            </Button>
            <Button disabled={reassignSubmitting} onClick={submitBulkReassign}>
              {reassignSubmitting ? "Saving..." : "Assign Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAssignUserOpen} onOpenChange={setBulkAssignUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Selected Drafts</DialogTitle>
            <DialogDescription>
              Assign selected drafts to one user. This can be used for both unassigned and client-tagged drafts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Assign To *</label>
              <select
                value={bulkAssignedToUserId}
                onChange={(e) => setBulkAssignedToUserId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select team member</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Customer Name (optional)
              </label>
              <input
                value={bulkCustomerName}
                onChange={(e) => setBulkCustomerName(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                placeholder="e.g. Praveen"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Customer Contact</label>
              <input
                value={bulkCustomerContact}
                onChange={(e) => setBulkCustomerContact(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                placeholder="Email or phone"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Platform</label>
              <select
                value={bulkPlatform}
                onChange={(e) => setBulkPlatform(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select platform</option>
                <option value="Google">Google</option>
                <option value="Facebook">Facebook</option>
                <option value="Justdial">Justdial</option>
                <option value="Website">Website</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignUserOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={bulkAssignUserSubmitting || selectedIds.length === 0}
              onClick={submitBulkAssignUser}
            >
              {bulkAssignUserSubmitting ? "Assigning..." : "Assign User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
