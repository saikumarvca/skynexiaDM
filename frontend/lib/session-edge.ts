/**
 * Edge-safe session verification (no Mongoose / Node-only imports).
 * Must stay in sync with HMAC signing in lib/auth.ts (`dm_session` cookie).
 */
import type { NextRequest } from "next/server";
import { DM_SESSION_COOKIE_NAME } from "@/lib/session-cookie-name";

export function getSessionCookieName(): string {
  return DM_SESSION_COOKIE_NAME;
}

/** Claims carried in the signed session token (see createSessionToken). */
export type EdgeSessionPayload = {
  uid: string;
  exp: number;
  /** Only set for external client logins; lets the proxy confine them. */
  role?: string;
  /** Client id for CLIENT logins. */
  cid?: string;
};

function base64UrlToBytes(s: string): Uint8Array {
  const padded =
    s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
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
    ["sign"],
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

/**
 * Verify signature + expiry and return the token claims, or null when the
 * token is missing, tampered with, or expired (no DB / isActive check).
 */
export async function readSessionTokenEdge(
  token: string,
  secret: string,
): Promise<EdgeSessionPayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  try {
    const expected = await signBody(body, secret);
    if (!timingSafeEqualString(sig, expected)) return null;

    const json = new TextDecoder().decode(base64UrlToBytes(body));
    const parsed = JSON.parse(json) as Partial<EdgeSessionPayload>;
    if (!parsed?.uid || typeof parsed.exp !== "number") return null;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) return null;
    return {
      uid: parsed.uid,
      exp: parsed.exp,
      role: typeof parsed.role === "string" ? parsed.role : undefined,
      cid: typeof parsed.cid === "string" ? parsed.cid : undefined,
    };
  } catch {
    return null;
  }
}

/** Verify signed session token body + signature + expiry (no DB / isActive check). */
export async function verifySessionTokenEdge(
  token: string,
  secret: string,
): Promise<boolean> {
  return (await readSessionTokenEdge(token, secret)) !== null;
}

/** Returns true if the dm_session cookie is present, signed correctly, and not expired. */
export async function verifySessionCookie(
  request: NextRequest,
): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  const token = request.cookies.get(DM_SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  return verifySessionTokenEdge(token, secret);
}
