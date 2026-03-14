"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Client } from "@/types"

interface CampaignFormProps {
  clients: Client[]
  action: (formData: FormData) => Promise<void>
  defaultClientId?: string
}

const STATUS_OPTIONS = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const

export function CampaignForm({ clients, action, defaultClientId }: CampaignFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign details</CardTitle>
      </CardHeader>
      <CardContent>
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
                defaultValue={defaultClientId}
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
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="PLANNED"
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
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="startDate" className="block text-sm font-medium">
                Start date
              </label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="endDate" className="block text-sm font-medium">
              End date
            </label>
            <Input id="endDate" name="endDate" type="date" />
          </div>

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
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit">Create campaign</Button>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
