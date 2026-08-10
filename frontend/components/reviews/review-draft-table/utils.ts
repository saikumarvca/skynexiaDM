export function truncate(s: string, len: number) {
  if (!s) return "—";
  return s.length <= len ? s : s.slice(0, len) + "…";
}

export type CSVImportRow = {
  subject: string;
  reviewText: string;
  category?: string;
  language?: string;
  suggestedRating?: string;
};

export function parseDraftsCSV(text: string): CSVImportRow[] {
  const parseRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === "," && !inQuotes) {
        out.push(cur.replace(/^"|"$/g, "").trim());
        cur = "";
      } else cur += c;
    }
    out.push(cur.replace(/^"|"$/g, "").trim());
    return out;
  };

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]!).map((h) =>
    h.toLowerCase().replace(/\s+/g, " "),
  );

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const vals = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = vals[j] ?? "";
    });
    rows.push(row);
  }

  return rows
    .map((r) => ({
      subject: (r.subject ?? "").trim(),
      reviewText: (r.reviewtext ?? r["review text"] ?? "").trim(),
      category: (r.category ?? "").trim() || undefined,
      language: (r.language ?? "").trim() || undefined,
      suggestedRating:
        (
          r.suggestedrating ??
          r.rating ??
          r["suggested rating"] ??
          ""
        ).trim() || undefined,
    }))
    .filter((d) => d.subject || d.reviewText);
}

