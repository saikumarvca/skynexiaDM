import { useState } from "react";
import { toast } from "sonner";
import { parseDraftsCSV } from "./utils";

type Params = {
  selectedClientId?: string;
  onImported: () => void;
};

export function useDraftsImport({ selectedClientId, onImported }: Params) {
  const [importLoading, setImportLoading] = useState(false);

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
        onImported();
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

  return { importLoading, handleImportFile };
}

