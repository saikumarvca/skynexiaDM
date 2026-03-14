"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Client } from "@/types"
import { ContentCategory, ContentItemStatus, ContentItemSource } from "@/types"

interface ContentFormProps {
  clients: Client[]
  action: (formData: FormData) => Promise<void>
  defaultClientId?: string
}

const CATEGORIES: ContentCategory[] = ["CAPTION", "HASHTAGS", "AD_COPY", "CTA", "HOOK", "OTHER"]
const STATUSES: ContentItemStatus[] = ["DRAFT", "APPROVED", "ARCHIVED"]
const SOURCES: ContentItemSource[] = ["MANUAL", "AI", "IMPORT"]

export function ContentForm({ clients, action, defaultClientId }: ContentFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content details</CardTitle>
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
              <label htmlFor="category" className="block text-sm font-medium">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Summer promo caption"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium">
              Content *
            </label>
            <Textarea
              id="content"
              name="content"
              placeholder="Paste or write your caption, hashtags, ad copy, CTA, or hook..."
              rows={6}
              className="resize-none"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="platform" className="block text-sm font-medium">
                Platform
              </label>
              <Input
                id="platform"
                name="platform"
                placeholder="e.g. Instagram, Facebook"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tags" className="block text-sm font-medium">
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g. summer, sale, promo"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="DRAFT"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="source" className="block text-sm font-medium">
                Source
              </label>
              <select
                id="source"
                name="source"
                defaultValue="MANUAL"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit">Add content</Button>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
