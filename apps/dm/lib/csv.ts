export function toCsv(headers: string[], rows: string[][]): string {
  // Escape fields that contain commas, quotes, or newlines
  const escape = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };
  const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
  return lines.join("\n");
}
