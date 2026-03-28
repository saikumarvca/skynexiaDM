/**
 * Edge-safe session verification (no Mongoose / Node-only imports).
 * Must stay in sync with HMAC signing in lib/auth.ts (`dm_session` cookie).
 */
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "dm_session";

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

function base64UrlToBytes(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const u8 = new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signBody(body: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return bytesToBase64Url(sig);
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

/** Verify signed session token body + signature + expiry (no DB / isActive check). */
export async function verifySessionTokenEdge(token: string, secret: string): Promise<boolean> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;

  try {
    const expected = await signBody(body, secret);
    if (!timingSafeEqualString(sig, expected)) return false;

    const json = new TextDecoder().decode(base64UrlToBytes(body));
    const parsed = JSON.parse(json) as { uid?: string; exp?: number };
    if (!parsed?.uid || typeof parsed.exp !== "number") return false;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) return false;
    return true;
  } catch {
    return false;
  }
}

/** Returns true if the dm_session cookie is present, signed correctly, and not expired. */
export async function verifySessionCookie(request: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  return verifySessionTokenEdge(token, secret);
}
