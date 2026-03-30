import type { ReviewDraft } from "@/types/reviews";

export function filterDraftsBySearch(drafts: ReviewDraft[], search: string) {
  if (!search) return drafts;
  const s = search.toLowerCase();
  return drafts.filter((d) => {
    return (
      (d.subject ?? "").toLowerCase().includes(s) ||
      (d.reviewText ?? "").toLowerCase().includes(s) ||
      (d.clientName ?? "").toLowerCase().includes(s) ||
      (d.category ?? "").toLowerCase().includes(s)
    );
  });
}

export function getDraftClientName(d: ReviewDraft) {
  const c = d.clientId;
  if (typeof c === "object" && c && "businessName" in c)
    return (c as { businessName?: string }).businessName ?? "—";
  return d.clientName ?? "—";
}

