"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Check, X, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ContentType = "CAPTION" | "HASHTAGS" | "AD_COPY" | "CTA" | "HOOK";

interface AIGenerateButtonProps {
  clientId?: string;
  onUse?: (content: string, type: ContentType) => void;
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "CAPTION", label: "Caption" },
  { value: "HASHTAGS", label: "Hashtags" },
  { value: "AD_COPY", label: "Ad Copy" },
  { value: "CTA", label: "Call to Action" },
  { value: "HOOK", label: "Hook" },
];

const PLATFORMS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Google Ads",
  "Twitter / X",
  "TikTok",
  "YouTube",
  "Pinterest",
];

const TONES = ["Professional", "Casual", "Humorous", "Inspirational"];

export function AIGenerateButton({ clientId, onUse }: AIGenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<ContentType>("CAPTION");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Professional");
  const [saveToBank, setSaveToBank] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      toast.error("Please enter a topic or description");
      return;
    }

    setGenerating(true);
    setError(null);
    setGenerated("");

    try {
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contentType,
          platform,
          topic: trimmedTopic,
          tone,
          clientId: clientId || undefined,
          saveToBank: saveToBank && Boolean(clientId),
        }),
      });

      const data = (await res.json()) as { content?: string; error?: string };

      if (!res.ok) {
        const msg = data.error ?? "Generation failed";
        setError(msg);
        if (res.status === 503) {
          toast.error("AI is not configured. Contact your administrator.");
        } else {
          toast.error(msg);
        }
        return;
      }

      if (data.content) {
        setGenerated(data.content);
        if (saveToBank && clientId) {
          toast.success("Content generated and saved to content bank");
        } else {
          toast.success("Content generated");
        }
      }
    } catch {
      const msg = "An unexpected error occurred";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  function handleUse() {
    if (!generated || !onUse) return;
    onUse(generated, contentType);
    toast.success("Content applied to form");
    setIsOpen(false);
  }

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((o) => !o)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4 text-purple-500" />
        Generate with AI
        <ChevronDown
          className={[
            "h-3.5 w-3.5 transition-transform",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </Button>

      {isOpen && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Content Generator
              </CardTitle>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Topic */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Topic / Description</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Summer sale on handmade jewellery"
                disabled={generating}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Content type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Content type</label>
                <select
                  value={contentType}
                  onChange={(e) =>
                    setContentType(e.target.value as ContentType)
                  }
                  disabled={generating}
                  className={selectClass}
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  disabled={generating}
                  className={selectClass}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  disabled={generating}
                  className={selectClass}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Save to bank */}
            {clientId && (
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToBank}
                  onChange={(e) => setSaveToBank(e.target.checked)}
                  disabled={generating}
                  className="rounded border-input"
                />
                Save to content bank
              </label>
            )}

            {/* Generate button */}
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating…" : "Generate"}
            </Button>

            {/* Error */}
            {error && !generating && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Generated content */}
            {generated && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Generated content</label>
                <Textarea
                  value={generated}
                  onChange={(e) => setGenerated(e.target.value)}
                  rows={6}
                  className="resize-none font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  {onUse && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUse}
                      className="gap-1.5"
                    >
                      Use this
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
