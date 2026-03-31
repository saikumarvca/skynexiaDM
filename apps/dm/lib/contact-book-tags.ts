/** Curated one-click labels for grouping contacts (not enforced — custom tags allowed). */
export const PROPOSED_CONTACT_BOOK_TAGS = [
  "Review request",
  "SEO",
  "Video / like",
  "Subscribe / channel",
  "General",
] as const;

export type ProposedContactBookTag =
  (typeof PROPOSED_CONTACT_BOOK_TAGS)[number];

const proposedLower = new Set(
  PROPOSED_CONTACT_BOOK_TAGS.map((t) => t.toLowerCase()),
);

export function isProposedContactTag(tag: string): boolean {
  return proposedLower.has(tag.trim().toLowerCase());
}

/** Trim, drop empty, dedupe case-insensitively (keeps first spelling). */
export function normalizeContactTags(input: string[] | undefined): string[] {
  if (!input?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const t = raw.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export function proposedTagSetLower(): Set<string> {
  return new Set(proposedLower);
}
