"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AccessCardItem = {
  name: string;
  href: string;
  section: string;
};

export function WelcomeAccessClient({
  items,
}: {
  items: AccessCardItem[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      return (
        i.name.toLowerCase().includes(q) ||
        i.section.toLowerCase().includes(q) ||
        i.href.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="max-w-xl">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by module, section, or route..."
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No access cards matched your search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link key={`${item.section}:${item.href}`} href={item.href}>
              <Card className="h-full hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">{item.section}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {item.href}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

