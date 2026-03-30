import { useEffect, useState } from "react";
import type { LiveResults } from "./types";

export function useLiveSearch(query: string) {
  const [results, setResults] = useState<LiveResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Search failed");
        const data: LiveResults = await res.json();
        setResults(data);
      } catch {
        setError(true);
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, error };
}

