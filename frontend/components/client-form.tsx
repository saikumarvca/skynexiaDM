"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientFormData } from "@/types";
import { parseFlexibleDateParam, toDdMmYyyyDisplay } from "@/lib/date-format";

function isoSliceToDdMm(iso?: string | null): string {
  if (!iso) return "";
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? toDdMmYyyyDisplay(day) : "";
}

function normalizeUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  // Best-effort default for common plain-domain input
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function sanitizeReviewDestinations(
  rows: { platform: string; reviewDestinationUrl: string; reviewQrImageUrl: string }[],
) {
  return rows
    .map((row) => ({
      platform: row.platform.trim(),
      reviewDestinationUrl: normalizeUrlInput(row.reviewDestinationUrl) || undefined,
      reviewQrImageUrl: normalizeUrlInput(row.reviewQrImageUrl) || undefined,
    }))
    .filter(
      (row) => row.platform && (row.reviewDestinationUrl || row.reviewQrImageUrl),
    );
}

const REVIEW_PLATFORM_OPTIONS = [
  "Google",
  "Facebook",
  "Justdial",
  "Website",
  "Other",
] as const;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  redirectTo?: string;
  /** Optional team members for assigned manager select */
  managers?: { _id: string; name: string }[];
  /** If editing an existing client, pass its id to exclude from duplicate checks */
  editingId?: string;
}

export function ClientForm({
  initialData,
  onSubmit,
  redirectTo,
  managers,
  editingId,
}: ClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [reviewDestinations, setReviewDestinations] = useState<
    { platform: string; reviewDestinationUrl: string; reviewQrImageUrl: string }[]
  >(
    (initialData?.reviewDestinations?.length
      ? initialData.reviewDestinations
      : initialData?.reviewDestinationUrl || initialData?.reviewQrImageUrl
        ? [
            {
              platform: "Google",
              reviewDestinationUrl: initialData.reviewDestinationUrl ?? "",
              reviewQrImageUrl: initialData.reviewQrImageUrl ?? "",
            },
          ]
        : [{ platform: "Google", reviewDestinationUrl: "", reviewQrImageUrl: "" }]
    ).map((x) => ({
      platform: x.platform ?? "",
      reviewDestinationUrl: x.reviewDestinationUrl ?? "",
      reviewQrImageUrl: x.reviewQrImageUrl ?? "",
    })),
  );
  const [dupWarnings, setDupWarnings] = useState<{
    email?: boolean;
    businessName?: boolean;
  }>({});
  const [uploadingQrIndex, setUploadingQrIndex] = useState<number | null>(null);
  const dupAbortRef = useRef<AbortController | null>(null);

  const checkDuplicate = useCallback(
    async (field: "email" | "businessName", value: string) => {
      if (!value.trim()) {
        setDupWarnings((w) => ({ ...w, [field]: false }));
        return;
      }
      try {
        if (dupAbortRef.current) dupAbortRef.current.abort();
        dupAbortRef.current = new AbortController();
        const res = await fetch("/api/clients/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value.trim(), excludeId: editingId }),
          signal: dupAbortRef.current.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          email?: boolean;
          businessName?: boolean;
        };
        setDupWarnings((w) => ({ ...w, [field]: data[field] ?? false }));
      } catch {
        // ignore abort or network errors silently
      }
    },
    [editingId],
  );
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    businessName: initialData?.businessName || "",
    brandName: initialData?.brandName || "",
    contactName: initialData?.contactName || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    notes: initialData?.notes || "",
    status: (initialData?.status || "ACTIVE") as ClientFormData["status"],
    website: initialData?.website || "",
    industry: initialData?.industry || "",
    location: initialData?.location || "",
    marketingChannelsInput: (initialData?.marketingChannels ?? []).join(", "),
    contractStartInput: isoSliceToDdMm(initialData?.contractStart),
    contractEndInput: isoSliceToDdMm(initialData?.contractEnd),
    monthlyBudgetInput:
      initialData?.monthlyBudget !== undefined &&
      initialData?.monthlyBudget !== null
        ? String(initialData.monthlyBudget)
        : "",
    assignedManagerId: initialData?.assignedManagerId || "",
    reviewDestinationUrl: initialData?.reviewDestinationUrl || "",
    reviewQrImageUrl: initialData?.reviewQrImageUrl || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const channels = formData.marketingChannelsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const contractStart =
        parseFlexibleDateParam(formData.contractStartInput) ?? null;
      const contractEnd =
        parseFlexibleDateParam(formData.contractEndInput) ?? null;
      const budgetTrim = formData.monthlyBudgetInput.trim();
      const sanitizedDestinations = sanitizeReviewDestinations(reviewDestinations);
      const firstDestination = sanitizedDestinations[0];
      const payload: ClientFormData = {
        name: formData.name,
        businessName: formData.businessName,
        brandName: formData.brandName,
        contactName: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        notes: formData.notes || undefined,
        status: formData.status,
        website: formData.website.trim() || undefined,
        industry: formData.industry.trim() || undefined,
        location: formData.location.trim() || undefined,
        marketingChannels: channels.length ? channels : undefined,
        contractStart,
        contractEnd,
        monthlyBudget: budgetTrim === "" ? null : Number(budgetTrim),
        assignedManagerId: formData.assignedManagerId.trim() || null,
        reviewDestinationUrl:
          normalizeUrlInput(formData.reviewDestinationUrl) ||
          firstDestination?.reviewDestinationUrl ||
          undefined,
        reviewQrImageUrl:
          normalizeUrlInput(formData.reviewQrImageUrl) ||
          firstDestination?.reviewQrImageUrl ||
          undefined,
        reviewDestinations: sanitizedDestinations,
      };
      if (
        payload.monthlyBudget !== null &&
        Number.isNaN(payload.monthlyBudget)
      ) {
        throw new Error("Invalid monthly budget");
      }
      await onSubmit(payload);
      toast.success(initialData ? "Changes saved" : "Client created");
      router.push(redirectTo ?? "/clients");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const managerChoices = useMemo(() => {
    const m = managers ?? [];
    const id = formData.assignedManagerId.trim();
    if (!id || m.some((x) => x._id === id)) return m;
    return [
      ...m,
      { _id: id, name: `${id.length > 14 ? `${id.slice(0, 14)}…` : id}` },
    ];
  }, [managers, formData.assignedManagerId]);

  const handleQrFileSelected = async (idx: number, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file for QR");
      return;
    }
    if (file.size > 1_500_000) {
      toast.error("QR image is too large. Please use an image under 1.5 MB.");
      return;
    }
    setUploadingQrIndex(idx);
    try {
      const dataUrl = await fileToDataUrl(file);
      setReviewDestinations((prev) =>
        prev.map((row, i) =>
          i === idx ? { ...row, reviewQrImageUrl: dataUrl } : row,
        ),
      );
      toast.success("QR image uploaded");
    } catch {
      toast.error("Could not read QR image");
    } finally {
      setUploadingQrIndex(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Client Name
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2 rounded-md border p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Review Destinations by Platform
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setReviewDestinations((prev) => [
                  ...prev,
                  {
                    platform: "",
                    reviewDestinationUrl: "",
                    reviewQrImageUrl: "",
                  },
                ])
              }
            >
              Add platform
            </Button>
          </div>
          <div className="space-y-3">
            {reviewDestinations.map((row, idx) => (
              <div
                key={`dest-${idx}`}
                className="grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-[1fr_2fr_2fr_auto_auto]"
              >
                <select
                  value={row.platform}
                  onChange={(e) =>
                    setReviewDestinations((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, platform: e.target.value } : x,
                      ),
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Select platform</option>
                  {REVIEW_PLATFORM_OPTIONS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                <Input
                  type="text"
                  value={row.reviewDestinationUrl}
                  onChange={(e) =>
                    setReviewDestinations((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? { ...x, reviewDestinationUrl: e.target.value }
                          : x,
                      ),
                    )
                  }
                  placeholder="Review destination URL"
                />
                <Input
                  type="text"
                  value={row.reviewQrImageUrl}
                  onChange={(e) =>
                    setReviewDestinations((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, reviewQrImageUrl: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="QR image URL"
                />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted">
                  {uploadingQrIndex === idx ? "Uploading..." : "Upload QR"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      void handleQrFileSelected(idx, file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setReviewDestinations((prev) =>
                      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label
            htmlFor="businessName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Business Name
          </label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleChange("businessName", e.target.value)}
            onBlur={(e) => checkDuplicate("businessName", e.target.value)}
            required
          />
          {dupWarnings.businessName && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Another client has this business name
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="brandName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Brand Name
          </label>
          <Input
            id="brandName"
            value={formData.brandName}
            onChange={(e) => handleChange("brandName", e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="contactName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Contact Name
          </label>
          <Input
            id="contactName"
            value={formData.contactName}
            onChange={(e) => handleChange("contactName", e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Phone
          </label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={(e) => checkDuplicate("email", e.target.value)}
            required
          />
          {dupWarnings.email && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Another client has this email
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Status
          </label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              handleChange("status", value as ClientFormData["status"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Website
          </label>
          <Input
            id="website"
            type="text"
            value={formData.website}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="https://"
          />
        </div>
        <div>
          <label
            htmlFor="industry"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Industry
          </label>
          <Input
            id="industry"
            value={formData.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Location
          </label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="marketingChannelsInput"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Marketing channels
          </label>
          <Input
            id="marketingChannelsInput"
            value={formData.marketingChannelsInput}
            onChange={(e) =>
              handleChange("marketingChannelsInput", e.target.value)
            }
            placeholder="e.g. Instagram, Google Ads, Email"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Comma-separated list
          </p>
        </div>
        <div>
          <label
            htmlFor="contractStartInput"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Contract start
          </label>
          <Input
            id="contractStartInput"
            value={formData.contractStartInput}
            onChange={(e) => handleChange("contractStartInput", e.target.value)}
            placeholder="dd-mm-yyyy"
          />
        </div>
        <div>
          <label
            htmlFor="contractEndInput"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Contract end
          </label>
          <Input
            id="contractEndInput"
            value={formData.contractEndInput}
            onChange={(e) => handleChange("contractEndInput", e.target.value)}
            placeholder="dd-mm-yyyy"
          />
        </div>
        <div>
          <label
            htmlFor="monthlyBudgetInput"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Monthly budget
          </label>
          <Input
            id="monthlyBudgetInput"
            type="number"
            min={0}
            step="0.01"
            value={formData.monthlyBudgetInput}
            onChange={(e) => handleChange("monthlyBudgetInput", e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label
            htmlFor="assignedManagerId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Assigned manager
          </label>
          {managerChoices.length > 0 ? (
            <Select
              value={formData.assignedManagerId || "__none__"}
              onValueChange={(v) =>
                handleChange("assignedManagerId", v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger id="assignedManagerId">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {managerChoices.map((m) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="assignedManagerId"
              value={formData.assignedManagerId}
              onChange={(e) =>
                handleChange("assignedManagerId", e.target.value)
              }
              placeholder="Team member ID (optional)"
            />
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Notes
        </label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={4}
        />
      </div>
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Client"}
        </Button>
      </div>
    </form>
  );
}
