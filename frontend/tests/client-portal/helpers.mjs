/**
 * Shared helpers for the client-portal integration tests (node:test).
 * Tests talk HTTP to a running app (BASE_URL) that points at the seeded test
 * database (TEST_MONGODB_URI); see run.mjs and seed.mjs.
 */
import mongoose from "mongoose";

export const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3199").replace(/\/$/, "");
export const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || "";

export const PASSWORD = "Portal-Test-Pass-1";

export const FIXTURE_IDS = {
  clientA: "66a000000000000000000a01",
  clientB: "66a000000000000000000b01",
  admin: "66a0000000000000000000a1",
  managerNoPerm: "66a0000000000000000000a2",
  managerClients: "66a0000000000000000000a3",
  clientAUser: "66a0000000000000000000c1",
  clientBUser: "66a0000000000000000000c2",
  clientInactive: "66a0000000000000000000c3",
  draftA1: "66a000000000000000000d01",
  draftA2: "66a000000000000000000d02",
  draftA3: "66a000000000000000000d03",
  draftB1: "66a000000000000000000d11",
  allocA1: "66a000000000000000000e01",
  allocA3: "66a000000000000000000e03",
  allocB1: "66a000000000000000000e11",
  postedA1: "66a000000000000000000f01",
  eventAVisible: "66a0000000000000000001a1",
  eventAInternal: "66a0000000000000000001a2",
  eventBVisible: "66a0000000000000000001b1",
  updateA: "66a0000000000000000002a1",
  updateB: "66a0000000000000000002b1",
  notifA: "66a0000000000000000003a1",
  notifB: "66a0000000000000000003b1",
};

export const ACCOUNTS = {
  admin: { email: "portal-admin@test.local", name: "Portal Admin" },
  managerNoPerm: { email: "portal-manager@test.local", name: "Portal Manager" },
  managerClients: { email: "portal-accounts@test.local", name: "Portal Accounts" },
  clientA: { email: "alpha@test.local", name: "Alpha Dental" },
  clientB: { email: "beta@test.local", name: "Beta Motors" },
  clientInactive: { email: "inactive@test.local", name: "Inactive Client" },
};

export function cookieFromResponse(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie")];
  return raw
    .filter(Boolean)
    .map((c) => c.split(";")[0])
    .join("; ");
}

export function cookieValue(cookieHeader, name) {
  const m = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${name}=`));
  return m ? m.slice(name.length + 1) : "";
}

export async function login(email, password = PASSWORD, extra = {}) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, ...extra }),
    redirect: "manual",
  });
  const body = await res.json().catch(() => ({}));
  return { res, body, cookie: cookieFromResponse(res) };
}

export async function api(path, { method = "GET", cookie = "", body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { res, status: res.status, json, text, location: res.headers.get("location") };
}

export async function page(path, cookie = "") {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  const text = await res.text();
  return { res, status: res.status, text, location: res.headers.get("location") };
}

let dbPromise = null;
export async function db() {
  if (!TEST_MONGODB_URI) throw new Error("TEST_MONGODB_URI is not set");
  if (!dbPromise) dbPromise = mongoose.connect(TEST_MONGODB_URI).then((m) => m.connection.db);
  return dbPromise;
}

export async function closeDb() {
  if (dbPromise) {
    await mongoose.disconnect();
    dbPromise = null;
  }
}

export const oid = (hex) => new mongoose.Types.ObjectId(hex);
