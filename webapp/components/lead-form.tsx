"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/types";
import { Campaign } from "@/types";
import { LeadStatus } from "@/types";

interface LeadFormProps {
  clients: Client[];
  campaigns: Campaign[];
  action: (formData: FormData) => Promise<void>;
  defaultClientId?: string;
}

const STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export function LeadForm({
  clients,
  campaigns,
  action,
  defaultClientId,
}: LeadFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead details</CardTitle>
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
              <label htmlFor="campaignId" className="block text-sm font-medium">
                Campaign
              </label>
              <select
                id="campaignId"
                name="campaignId"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {campaigns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.campaignName}{" "}
                    {typeof c.clientId === "object"
                      ? `(${(c.clientId as { businessName?: string }).businessName})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Name *
              </label>
              <Input id="name" name="name" placeholder="Lead name" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="NEW"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="source" className="block text-sm font-medium">
              Source
            </label>
            <Input
              id="source"
              name="source"
              placeholder="e.g. Google Ads, Facebook, Referral"
            />
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
            <Button type="submit">Add lead</Button>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
