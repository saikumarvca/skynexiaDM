"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/types";

interface KeywordFormProps {
  clients: Client[];
  action: (formData: FormData) => Promise<void>;
  defaultClientId?: string;
}

export function KeywordForm({
  clients,
  action,
  defaultClientId,
}: KeywordFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword details</CardTitle>
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
              <label htmlFor="keyword" className="block text-sm font-medium">
                Keyword *
              </label>
              <Input
                id="keyword"
                name="keyword"
                placeholder="e.g. best coffee shop nyc"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="rank" className="block text-sm font-medium">
                Current rank
              </label>
              <Input
                id="rank"
                name="rank"
                type="number"
                min={1}
                placeholder="1–100"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="searchVolume"
                className="block text-sm font-medium"
              >
                Search volume
              </label>
              <Input
                id="searchVolume"
                name="searchVolume"
                type="number"
                min={0}
                placeholder="e.g. 1200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="difficulty" className="block text-sm font-medium">
                Difficulty (0–100)
              </label>
              <Input
                id="difficulty"
                name="difficulty"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 45"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="targetUrl" className="block text-sm font-medium">
              Target URL
            </label>
            <Input
              id="targetUrl"
              name="targetUrl"
              type="url"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="competitorUrls"
              className="block text-sm font-medium"
            >
              Competitor URLs (comma-separated)
            </label>
            <Input
              id="competitorUrls"
              name="competitorUrls"
              placeholder="https://competitor1.com/page, https://..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit">Add keyword</Button>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
