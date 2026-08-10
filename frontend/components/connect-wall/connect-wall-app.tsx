"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Hash, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CONNECT_WALL_CHANNELS,
  type ConnectWallChannel,
} from "@/lib/connect-wall";

export type WallMessageDto = {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Props = {
  currentUserId: string;
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ConnectWallApp({ currentUserId }: Props) {
  const [channelId, setChannelId] = useState<ConnectWallChannel["id"]>(
    CONNECT_WALL_CHANNELS[0]!.id,
  );
  const [messages, setMessages] = useState<WallMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const load = useCallback(async (ch: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connect-wall/messages?channel=${encodeURIComponent(ch)}`,
      );
      const data = (await res.json()) as {
        messages?: WallMessageDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setMessages(data.messages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(channelId);
  }, [channelId, load]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/connect-wall/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, body: text }),
      });
      const data = (await res.json()) as {
        message?: WallMessageDto;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      if (data.message) {
        setMessages((prev) => [...prev, data.message!]);
        setDraft("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const activeChannel =
    CONNECT_WALL_CHANNELS.find((c) => c.id === channelId) ??
    CONNECT_WALL_CHANNELS[0]!;

  return (
    <div className="flex min-h-[calc(100dvh-8.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm md:flex-row">
      {/* Channel sidebar — Slack-style */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-muted/30 md:w-56 md:border-b-0 md:border-r">
        <div className="border-b border-border px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connect
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            Org-wide chat — same channels for everyone.
          </p>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto p-2 scrollbar-thin md:flex-col md:gap-0 md:overflow-x-visible md:p-2">
          <p className="hidden px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:block">
            Channels
          </p>
          {CONNECT_WALL_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChannelId(ch.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors md:w-full",
                channelId === ch.id
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Thread */}
      <section className="flex min-h-[min(70dvh,32rem)] min-w-0 flex-1 flex-col md:min-h-0">
        <header className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="text-base font-semibold tracking-tight">
              {activeChannel.name}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activeChannel.description}
          </p>
        </header>

        {error && (
          <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-thin"
        >
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2
                className="h-8 w-8 animate-spin"
                aria-label="Loading messages"
              />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet — start the conversation.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.authorId === currentUserId;
              return (
                <article
                  key={m.id}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm shadow-sm",
                    mine
                      ? "ml-4 border-primary/25 bg-primary/5"
                      : "mr-4 border-border bg-background",
                  )}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-foreground">
                      {m.authorName}
                    </span>
                    <time
                      className="text-[11px] text-muted-foreground"
                      dateTime={m.createdAt}
                    >
                      {formatTime(m.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-foreground/90">
                    {m.body}
                  </p>
                </article>
              );
            })
          )}
        </div>

        <footer className="border-t border-border bg-muted/20 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message #${activeChannel.name}`}
              className="min-h-[4.5rem] flex-1 resize-none bg-background text-sm"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              aria-label="Message text"
            />
            <Button
              type="button"
              className="shrink-0 gap-2 sm:mb-px"
              disabled={sending || !draft.trim()}
              onClick={() => void send()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              Send
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </p>
        </footer>
      </section>
    </div>
  );
}
