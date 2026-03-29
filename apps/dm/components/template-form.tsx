"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewTemplate } from "@/types";

interface TemplateFormProps {
  action: (formData: FormData) => Promise<void>;
  initial?: Partial<ReviewTemplate>;
  title?: string;
  submitLabel?: string;
}

export function TemplateForm({
  action,
  initial,
  title = "Template",
  submitLabel = "Save",
}: TemplateFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name *
              </label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initial?.name}
                placeholder="e.g. Service praise — short"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={initial?.description}
                placeholder="When to use this template…"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="industry" className="text-sm font-medium">
                Industry
              </label>
              <Input
                id="industry"
                name="industry"
                defaultValue={initial?.industry}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tone" className="text-sm font-medium">
                Tone
              </label>
              <Input
                id="tone"
                name="tone"
                defaultValue={initial?.tone}
                placeholder="e.g. Warm, professional"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="platform" className="text-sm font-medium">
                Platform
              </label>
              <Input
                id="platform"
                name="platform"
                defaultValue={initial?.platform}
                placeholder="e.g. Google"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="suggestedCategory"
                className="text-sm font-medium"
              >
                Suggested category
              </label>
              <Input
                id="suggestedCategory"
                name="suggestedCategory"
                defaultValue={initial?.suggestedCategory}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="suggestedLanguage"
                className="text-sm font-medium"
              >
                Suggested language
              </label>
              <Input
                id="suggestedLanguage"
                name="suggestedLanguage"
                defaultValue={initial?.suggestedLanguage}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="suggestedRatingStyle"
                className="text-sm font-medium"
              >
                Suggested rating style
              </label>
              <Input
                id="suggestedRatingStyle"
                name="suggestedRatingStyle"
                defaultValue={initial?.suggestedRatingStyle}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">{submitLabel}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
