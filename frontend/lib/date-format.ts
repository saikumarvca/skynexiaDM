/**
 * URL/query helpers: show dates as dd-mm-yyyy in forms while keeping ISO yyyy-mm-dd for APIs and Date().
 */

/** Convert yyyy-mm-dd (or already dd-mm-yyyy) to display dd-mm-yyyy */
export function toDdMmYyyyDisplay(value: string | undefined): string {
  if (!value?.trim()) return "";
  const t = value.trim();
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(t)) {
    const m = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (!m) return t;
    return `${m[1]!.padStart(2, "0")}-${m[2]!.padStart(2, "0")}-${m[3]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, mo, d] = t.split("-");
    return `${d}-${mo}-${y}`;
  }
  return t;
}

/** Parse form value: accepts dd-mm-yyyy or yyyy-mm-dd → yyyy-mm-dd or undefined if invalid */
export function parseFlexibleDateParam(
  value: string | undefined,
): string | undefined {
  if (!value?.trim()) return undefined;
  const t = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const dt = new Date(t + "T12:00:00.000Z");
    return Number.isNaN(dt.getTime()) ? undefined : t;
  }
  const m = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return undefined;
  const dd = m[1]!.padStart(2, "0");
  const mm = m[2]!.padStart(2, "0");
  const yyyy = m[3]!;
  const iso = `${yyyy}-${mm}-${dd}`;
  const dt = new Date(iso + "T12:00:00.000Z");
  if (Number.isNaN(dt.getTime())) return undefined;
  if (
    dt.getUTCFullYear() !== Number(yyyy) ||
    dt.getUTCMonth() + 1 !== Number(mm) ||
    dt.getUTCDate() !== Number(dd)
  ) {
    return undefined;
  }
  return iso;
}
