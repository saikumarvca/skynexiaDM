import { headers } from "next/headers";

/**
 * Internal server-side fetch helper.
 * Uses NEXT_PUBLIC_API_URL if set, otherwise falls back to localhost with the
 * correct PORT so server components can call their own API routes.
 */
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const port = process.env.PORT || "3152";
  return `http://localhost:${port}`;
}

/**
 * Same-origin fetch from Server Components / Server Actions → middleware does not
 * see the browser cookie unless we forward it from the incoming request.
 */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getBaseUrl();
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${pathname}`;
  const h = await headers();
  const cookie = h.get("cookie");
  const merged = new Headers();
  if (cookie) merged.set("cookie", cookie);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => merged.set(key, value));
  }
  return fetch(url, {
    ...init,
    cache: init?.cache ?? "no-store",
    headers: merged,
  });
}
