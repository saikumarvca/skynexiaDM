import { cookies, headers } from "next/headers";

/**
 * Internal server-side fetch helper.
 * Uses NEXT_PUBLIC_API_URL if set, otherwise falls back to localhost with the
 * correct PORT so server components can call their own API routes.
 */
export function getBaseUrl() {
  const port = process.env.PORT || "3152";
  return `http://localhost:${port}`;
}

/** Build Cookie header for outbound server-side fetches (RSC + Server Actions). */
async function cookieHeaderForInternalFetch(): Promise<string | null> {
  try {
    const jar = await cookies();
    const all = jar.getAll();
    if (all.length > 0) {
      return all.map((c) => `${c.name}=${c.value}`).join("; ");
    }
  } catch {
    // Outside a request (e.g. static generation)
    return null;
  }
  try {
    const h = await headers();
    return h.get("cookie");
  } catch {
    // Static generation / dynamic server usage — avoid failing the build
    return null;
  }
}

/**
 * Read JSON `{ error?: string }` from a failed API response for user-facing messages.
 */
export async function errorMessageFromResponse(
  res: Response,
  fallback: string,
): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { error?: unknown };
    if (typeof j.error === "string" && j.error.trim()) return j.error.trim();
  } catch {
    // not JSON
  }
  if (res.statusText) return `${fallback} (${res.status} ${res.statusText})`;
  return `${fallback} (${res.status})`;
}

/**
 * Same-origin fetch from Server Components / Server Actions → forward session cookies.
 * Prefer `cookies()` because Server Actions often omit `Cookie` on `headers()`.
 */
export async function serverFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = getBaseUrl();
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${pathname}`;
  const cookie = await cookieHeaderForInternalFetch();
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
