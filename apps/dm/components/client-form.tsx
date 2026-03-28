"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientFormData } from "@/types"
import { parseFlexibleDateParam, toDdMmYyyyDisplay } from "@/lib/date-format"

function isoSliceToDdMm(iso?: string | null): string {
  if (!iso) return ""
  const day = iso.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? toDdMmYyyyDisplay(day) : ""
}

interface ClientFormProps {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => Promise<void>
  redirectTo?: string
  /** Optional team members for assigned manager select */
  managers?: { _id: string; name: string }[]
}

export function ClientForm({ initialData, onSubmit, redirectTo, managers }: ClientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
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
      initialData?.monthlyBudget !== undefined && initialData?.monthlyBudget !== null
        ? String(initialData.monthlyBudget)
        : "",
    assignedManagerId: initialData?.assignedManagerId || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const channels = formData.marketingChannelsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      const contractStart = parseFlexibleDateParam(formData.contractStartInput) ?? null
      const contractEnd = parseFlexibleDateParam(formData.contractEndInput) ?? null
      const budgetTrim = formData.monthlyBudgetInput.trim()
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
      }
      if (payload.monthlyBudget !== null && Number.isNaN(payload.monthlyBudget)) {
        throw new Error("Invalid monthly budget")
      }
      await onSubmit(payload)
      toast.success(initialData ? "Changes saved" : "Client created")
      router.push(redirectTo ?? "/clients")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const managerChoices = useMemo(() => {
    const m = managers ?? []
    const id = formData.assignedManagerId.trim()
    if (!id || m.some((x) => x._id === id)) return m
    return [...m, { _id: id, name: `${id.length > 14 ? `${id.slice(0, 14)}…` : id}` }]
  }, [managers, formData.assignedManagerId])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Client Name
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Business Name
          </label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleChange("businessName", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange("status", value as ClientFormData["status"])}
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
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Industry
          </label>
          <Input
            id="industry"
            value={formData.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            onChange={(e) => handleChange("marketingChannelsInput", e.target.value)}
            placeholder="e.g. Instagram, Google Ads, Email"
          />
          <p className="mt-1 text-xs text-muted-foreground">Comma-separated list</p>
        </div>
        <div>
          <label htmlFor="contractStartInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <label htmlFor="contractEndInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <label htmlFor="monthlyBudgetInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              onValueChange={(v) => handleChange("assignedManagerId", v === "__none__" ? "" : v)}
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
              onChange={(e) => handleChange("assignedManagerId", e.target.value)}
              placeholder="Team member ID (optional)"
            />
          )}
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
  )
}
