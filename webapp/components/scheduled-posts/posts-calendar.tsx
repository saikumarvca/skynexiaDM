"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduledPost, Client } from "@/types";

interface PostsCalendarProps {
  posts: ScheduledPost[];
  clients: Client[];
}

function clientName(post: ScheduledPost): string {
  const c = post.clientId;
  if (c && typeof c === "object") {
    return (
      (c as { businessName?: string }).businessName ??
      (c as { name?: string }).name ??
      "—"
    );
  }
  return "—";
}

function statusChipClass(status: ScheduledPost["status"]): string {
  switch (status) {
    case "SCHEDULED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "PUBLISHED":
      return "bg-green-100 text-green-800 border-green-200";
    case "FAILED":
      return "bg-red-100 text-red-800 border-red-200";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function PostsCalendar({ posts }: PostsCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Build a map from date string "yyyy-MM-dd" -> posts
  const postsByDate = new Map<string, ScheduledPost[]>();
  for (const post of posts) {
    if (!post.publishDate) continue;
    const key = format(parseISO(post.publishDate), "yyyy-MM-dd");
    const arr = postsByDate.get(key) ?? [];
    arr.push(post);
    postsByDate.set(key, arr);
  }

  // Generate weeks for the calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Chunk into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function prevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  }
  function nextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  }

  return (
    <div className="select-none">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-base font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7 gap-px">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
        {weeks.map((week, wi) =>
          week.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDate.get(key) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const todayDay = isToday(day);

            return (
              <div
                key={`${wi}-${key}`}
                className={`min-h-[90px] bg-background p-1 ${!inMonth ? "bg-muted/30 opacity-50" : ""}`}
              >
                {/* Day number */}
                <div
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    todayDay
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </div>

                {/* Post chips */}
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post._id}
                      onClick={() =>
                        router.push(
                          `/content/scheduled-posts/${post._id}/edit`,
                        )
                      }
                      className={`w-full truncate rounded border px-1 py-0.5 text-left text-[10px] font-medium leading-tight transition-opacity hover:opacity-80 ${statusChipClass(post.status)}`}
                      title={`${clientName(post)} · ${post.platform} · ${post.status}`}
                    >
                      {clientName(post)} · {post.platform}
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="block px-1 text-[10px] text-muted-foreground">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {(["SCHEDULED", "PUBLISHED", "FAILED", "CANCELLED"] as const).map(
          (s) => (
            <span
              key={s}
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${statusChipClass(s)}`}
            >
              {s}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
