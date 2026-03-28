"use client"

import { useState } from "react"
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

function DateInput({ id, name }: { id: string; name: string }) {
  const [display, setDisplay] = useState("") // DD-MM-YYYY shown to user
  const [pickerVal, setPickerVal] = useState("") // YYYY-MM-DD for the picker

  function handlePicker(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value // YYYY-MM-DD
    setPickerVal(val)
    if (val) {
      const [yyyy, mm, dd] = val.split("-")
      setDisplay(`${dd}-${mm}-${yyyy}`)
    } else {
      setDisplay("")
    }
  }

  function handleText(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setDisplay(val)
    if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
      const [dd, mm, yyyy] = val.split("-")
      setPickerVal(`${yyyy}-${mm}-${dd}`)
    } else {
      setPickerVal("")
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        value={display}
        onChange={handleText}
        placeholder="DD-MM-YYYY"
        pattern="\d{2}-\d{2}-\d{4}"
        className="flex-1"
      />
      <input
        type="date"
        value={pickerVal}
        onChange={handlePicker}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {/* hidden input carries DD-MM-YYYY to the server action */}
      <input type="hidden" id={id} name={name} value={display} />
    </div>
  )
}

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
              <DateInput id="startDate" name="startDate" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="endDate" className="block text-sm font-medium">
              End date
            </label>
            <DateInput id="endDate" name="endDate" />
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
