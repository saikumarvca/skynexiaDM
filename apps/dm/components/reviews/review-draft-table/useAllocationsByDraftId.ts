import { useEffect, useMemo, useState } from "react";

type AllocationLite = {
  _id: string;
  draftId: string | { _id?: string };
  assignedToUserId?: string;
  assignedToUserName?: string;
  createdAt?: string;
};

export function useAllocationsByDraftId(draftIds: string[]) {
  const idsKey = useMemo(() => draftIds.join(","), [draftIds]);
  const [allocationsByDraftId, setAllocationsByDraftId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let cancelled = false;
    async function loadAllocations() {
      try {
        if (draftIds.length === 0) {
          if (!cancelled) setAllocationsByDraftId({});
          return;
        }
        const url = new URL("/api/review-allocations", window.location.origin);
        url.searchParams.set("draftIds", draftIds.join(","));
        const res = await fetch(url.pathname + url.search, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load allocations");
        const list = (await res.json()) as AllocationLite[];
        const map: Record<string, string> = {};
        for (const a of list) {
          const id =
            typeof a.draftId === "string" ? a.draftId : (a.draftId?._id ?? "");
          if (!id) continue;
          // API sorts by createdAt desc, so first hit per draft is latest.
          if (map[id]) continue;
          if (a.assignedToUserId) {
            map[id] = a.assignedToUserName?.trim() || "Assigned";
          }
        }
        if (!cancelled) setAllocationsByDraftId(map);
      } catch (e) {
        console.error(e);
        if (!cancelled) setAllocationsByDraftId({});
      }
    }
    loadAllocations();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return allocationsByDraftId;
}

