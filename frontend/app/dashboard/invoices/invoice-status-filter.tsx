"use client";

const STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const;

export function InvoiceStatusFilter({
  defaultStatus,
}: {
  defaultStatus?: string;
}) {
  return (
    <form method="get">
      <select
        name="status"
        defaultValue={defaultStatus ?? ""}
        onChange={(e) => {
          (e.target.form as HTMLFormElement).submit();
        }}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
