"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DdMmYyyyDatePicker } from "@/components/dd-mm-yyyy-date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Client, Campaign } from "@/types"
import { toDdMmYyyyDisplay } from "@/lib/date-format"

interface CampaignFormProps {
  clients: Client[]
  action: (formData: FormData) => Promise<void>
  defaultClientId?: string
  /** When set, form is pre-filled for edit / sheet. */
  initialCampaign?: Campaign
  submitLabel?: string
  /** Wrap in Card; set false for Sheet. */
  showCard?: boolean
  showReset?: boolean
  /** Extra metrics fields (edit / sheet). */
  showMetrics?: boolean
}

const STATUS_OPTIONS = [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
] as const

function isoStartToDdMmYyyy(iso?: string): string | undefined {
  if (!iso) return undefined
  const day = iso.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined
  return toDdMmYyyyDisplay(day)
}

function clientIdFromCampaign(c: Campaign): string {
  return typeof c.clientId === "object" ? c.clientId._id : c.clientId
}

export function CampaignForm({
  clients,
  action,
  defaultClientId,
  initialCampaign,
  submitLabel,
  showCard = true,
  showReset,
  showMetrics,
}: CampaignFormProps) {
  const isEdit = Boolean(initialCampaign)
  const resolvedShowReset = showReset ?? !isEdit
  const resolvedShowMetrics = showMetrics ?? isEdit
  const resolvedSubmit = submitLabel ?? (isEdit ? "Save changes" : "Create campaign")

  const defaultClient =
    initialCampaign != null ? clientIdFromCampaign(initialCampaign) : defaultClientId

  const m = initialCampaign?.metrics

  const formInner = (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="clientId" className="block text-sm font-medium">
            Client *
          </label>
          <select
            id="clientId"
            name="clientId"
            required
            defaultValue={defaultClient}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.businessName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="campaignName" className="block text-sm font-medium">
            Campaign name *
          </label>
          <Input
            id="campaignName"
            name="campaignName"
            placeholder="e.g. Summer Sale 2025"
            required
            defaultValue={initialCampaign?.campaignName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="platform" className="block text-sm font-medium">
            Platform *
          </label>
          <Input
            id="platform"
            name="platform"
            placeholder="e.g. Facebook, Google Ads"
            required
            defaultValue={initialCampaign?.platform}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initialCampaign?.status ?? "PLANNED"}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="objective" className="block text-sm font-medium">
          Objective
        </label>
        <Input
          id="objective"
          name="objective"
          placeholder="e.g. Lead generation, Brand awareness"
          defaultValue={initialCampaign?.objective}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="budget" className="block text-sm font-medium">
          Budget
        </label>
        <Input
          id="budget"
          name="budget"
          type="number"
          min={0}
          step={0.01}
          placeholder="0"
          defaultValue={initialCampaign?.budget != null ? String(initialCampaign.budget) : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-medium">
            Start date
          </label>
          <DdMmYyyyDatePicker
            id="startDate"
            name="startDate"
            placeholder="dd-mm-yyyy"
            defaultValue={isoStartToDdMmYyyy(initialCampaign?.startDate)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="endDate" className="block text-sm font-medium">
            End date
          </label>
          <DdMmYyyyDatePicker
            id="endDate"
            name="endDate"
            placeholder="dd-mm-yyyy"
            defaultValue={isoStartToDdMmYyyy(initialCampaign?.endDate)}
          />
        </div>
      </div>

      {resolvedShowMetrics && (
        <div className="space-y-3 rounded-md border border-border p-4">
          <p className="text-sm font-medium">Metrics</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="metricImpressions" className="block text-sm font-medium">
                Impressions
              </label>
              <Input
                id="metricImpressions"
                name="metricImpressions"
                type="number"
                min={0}
                step={1}
                defaultValue={m?.impressions != null ? String(m.impressions) : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="metricClicks" className="block text-sm font-medium">
                Clicks
              </label>
              <Input
                id="metricClicks"
                name="metricClicks"
                type="number"
                min={0}
                step={1}
                defaultValue={m?.clicks != null ? String(m.clicks) : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="metricLeads" className="block text-sm font-medium">
                Leads
              </label>
              <Input
                id="metricLeads"
                name="metricLeads"
                type="number"
                min={0}
                step={1}
                defaultValue={m?.leads != null ? String(m.leads) : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="metricCtr" className="block text-sm font-medium">
                CTR
              </label>
              <Input
                id="metricCtr"
                name="metricCtr"
                type="number"
                min={0}
                step={0.01}
                defaultValue={m?.ctr != null ? String(m.ctr) : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="metricConversions" className="block text-sm font-medium">
                Conversions
              </label>
              <Input
                id="metricConversions"
                name="metricConversions"
                type="number"
                min={0}
                step={1}
                defaultValue={m?.conversions != null ? String(m.conversions) : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="metricCostPerLead" className="block text-sm font-medium">
                Cost per lead
              </label>
              <Input
                id="metricCostPerLead"
                name="metricCostPerLead"
                type="number"
                min={0}
                step={0.01}
                defaultValue={m?.costPerLead != null ? String(m.costPerLead) : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="metricConversionRate" className="block text-sm font-medium">
                Conversion rate
              </label>
              <Input
                id="metricConversionRate"
                name="metricConversionRate"
                type="number"
                min={0}
                step={0.01}
                defaultValue={m?.conversionRate != null ? String(m.conversionRate) : ""}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Optional notes"
          rows={3}
          className="resize-none"
          defaultValue={initialCampaign?.notes}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{resolvedSubmit}</Button>
        {resolvedShowReset && (
          <Button type="reset" variant="outline">
            Reset
          </Button>
        )}
      </div>
    </form>
  )

  if (!showCard) {
    return <div className="space-y-6">{formInner}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign details</CardTitle>
      </CardHeader>
      <CardContent>{formInner}</CardContent>
    </Card>
  )
}
