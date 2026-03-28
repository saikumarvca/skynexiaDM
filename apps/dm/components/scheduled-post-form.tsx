"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Client } from "@/types"
import type { ScheduledPostStatus } from "@/types"

function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

const STATUSES: ScheduledPostStatus[] = ["SCHEDULED", "PUBLISHED", "FAILED", "CANCELLED"]

export interface ScheduledPostFormInitial {
  clientId: string
  platform: string
  content: string
  publishDateIso: string
  timeZone?: string
  status: ScheduledPostStatus
  contentId?: string | null
}

interface ScheduledPostFormProps {
  clients: Client[]
  action: (formData: FormData) => Promise<void>
  defaultClientId?: string
  initial?: ScheduledPostFormInitial
  submitLabel?: string
}

export function ScheduledPostForm({
  clients,
  action,
  defaultClientId,
  initial,
  submitLabel = "Save",
}: ScheduledPostFormProps) {
  const defaultClient = initial?.clientId ?? defaultClientId

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="clientId" className="text-sm font-medium">
                Client *
              </label>
              <select
                id="clientId"
                name="clientId"
                required
                defaultValue={defaultClient ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              <label htmlFor="platform" className="text-sm font-medium">
                Platform *
              </label>
              <Input
                id="platform"
                name="platform"
                required
                placeholder="e.g. Instagram, LinkedIn"
                defaultValue={initial?.platform}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="publishDate" className="text-sm font-medium">
                Publish date & time *
              </label>
              <Input
                id="publishDate"
                name="publishDate"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocalValue(initial?.publishDateIso)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="timeZone" className="text-sm font-medium">
                Time zone
              </label>
              <Input
                id="timeZone"
                name="timeZone"
                placeholder="e.g. Asia/Kolkata"
                defaultValue={initial?.timeZone}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={initial?.status ?? "SCHEDULED"}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="contentId" className="text-sm font-medium">
                Content item ID (optional)
              </label>
              <Input
                id="contentId"
                name="contentId"
                placeholder="Link to content bank item"
                defaultValue={initial?.contentId ?? ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="content" className="text-sm font-medium">
                Post body *
              </label>
              <Textarea
                id="content"
                name="content"
                required
                rows={6}
                placeholder="Caption, thread, or post copy…"
                defaultValue={initial?.content}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit">{submitLabel}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
