/**
 * Idempotent backfill: map historical review activity into the client-visible
 * event feed (ClientEvent) for every client, or for one client.
 *
 * The mapping logic lives in the app (lib/client-portal/events.ts), so this
 * script signs in as an admin and calls the admin backfill endpoint of a
 * running instance. Re-running is safe: rows already mapped are skipped.
 *
 *   BASE_URL=http://localhost:3152 \
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' \
 *   node scripts/backfill-client-events.mjs [--client <clientId>]
 */
const baseUrl = (process.env.BASE_URL || "http://localhost:3152").replace(/\/$/, "");
const email = process.env.ADMIN_EMAIL || "";
const password = process.env.ADMIN_PASSWORD || "";
const clientArgIdx = process.argv.indexOf("--client");
const clientId = clientArgIdx >= 0 ? process.argv[clientArgIdx + 1] : undefined;

if (!email || !password) {
  console.error("\n✗ ADMIN_EMAIL and ADMIN_PASSWORD are required.\n");
  process.exit(1);
}

const login = await fetch(`${baseUrl}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) {
  console.error(`\n✗ Login failed (${login.status}): ${await login.text()}\n`);
  process.exit(1);
}
const cookie = (login.headers.get("set-cookie") || "").split(";")[0];

const res = await fetch(`${baseUrl}/api/admin/client-events/backfill`, {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie },
  body: JSON.stringify(clientId ? { clientId } : {}),
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`\n✗ Backfill failed (${res.status}): ${JSON.stringify(body)}\n`);
  process.exit(1);
}
console.log(`\n✓ Client events backfilled${clientId ? ` for client ${clientId}` : ""}`);
console.log(`   Scanned:        ${body.scanned}`);
console.log(`   Already mapped: ${body.alreadyMapped}`);
console.log(`   Created:        ${body.created}\n`);
