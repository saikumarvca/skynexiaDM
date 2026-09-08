/**
 * Client-portal test runner.
 *
 *   pnpm test:client-portal
 *
 * 1. Seeds an isolated test database (TEST_MONGODB_URI, default: the
 *    MONGODB_URI from .env/.env.local with the database renamed to
 *    "<db>_client_portal_test").
 * 2. Starts the app on TEST_PORT (default 3199) against that database
 *    (`next start` when a production build exists, otherwise `next dev`).
 * 3. Runs every *.test.mjs in this folder with node:test.
 * 4. Stops the server and exits with the test status.
 *
 * Set BASE_URL to reuse an already running instance (step 2 is skipped; it
 * must point at the seeded TEST_MONGODB_URI).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedTestDatabase } from "./seed.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

function loadDotEnv() {
  const out = {};
  for (const file of [".env.local", ".env"]) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(m[1] in out)) out[m[1]] = v;
    }
  }
  return out;
}

const dotenv = loadDotEnv();
const baseUri = process.env.MONGODB_URI || dotenv.MONGODB_URI;
const authSecret = process.env.AUTH_SECRET || dotenv.AUTH_SECRET;
if (!baseUri) {
  console.error("MONGODB_URI is required (env or .env)");
  process.exit(1);
}
if (!authSecret) {
  console.error("AUTH_SECRET is required (env or .env)");
  process.exit(1);
}

function testUriFrom(uri) {
  const u = new URL(uri);
  const dbName = (u.pathname.replace(/^\//, "") || "skynexia").replace(/_client_portal_test$/, "");
  u.pathname = `/${dbName}_client_portal_test`;
  return u.toString();
}
const testUri = process.env.TEST_MONGODB_URI || testUriFrom(baseUri);
const port = Number(process.env.TEST_PORT || 3199);
const externalBase = process.env.BASE_URL;
const baseUrl = externalBase || `http://127.0.0.1:${port}`;

console.log(`\n▶ Seeding ${testUri}`);
await seedTestDatabase(testUri);

let server = null;
async function waitForServer(url, timeoutMs = 180_000) {
  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch(`${url}/client/login`, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    if (Date.now() - start > timeoutMs) throw new Error("Server did not start in time");
    await new Promise((r) => setTimeout(r, 1000));
  }
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

if (!externalBase) {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const hasBuild = fs.existsSync(path.join(root, ".next", "BUILD_ID"));
  const args = hasBuild ? ["start", "-p", String(port)] : ["dev", "-p", String(port)];
  console.log(`▶ Starting app: next ${args.join(" ")} (${hasBuild ? "production build" : "dev mode"})`);
  server = spawn(process.execPath, [nextBin, ...args], {
    cwd: root,
    env: {
      ...process.env,
      MONGODB_URI: testUri,
      AUTH_SECRET: authSecret,
      PORT: String(port),
      NEXT_PUBLIC_API_URL: baseUrl,
      NODE_ENV: hasBuild ? "production" : "development",
      NEXT_TELEMETRY_DISABLED: "1",
      // The suite signs in dozens of times from one IP.
      LOGIN_RATE_LIMIT_MAX_ATTEMPTS: "1000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (d) => process.env.TEST_VERBOSE && process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));
  try {
    await waitForServer(baseUrl);
  } catch (e) {
    killTree(server);
    console.error(e.message);
    process.exit(1);
  }
}

console.log(`▶ Running tests against ${baseUrl}\n`);
const testFiles = fs
  .readdirSync(here)
  .filter((f) => f.endsWith(".test.mjs"))
  .map((f) => path.join(here, f));

const runner = spawn(process.execPath, ["--test", "--test-concurrency=1", ...testFiles], {
  cwd: root,
  env: { ...process.env, BASE_URL: baseUrl, TEST_MONGODB_URI: testUri },
  stdio: "inherit",
});
const code = await new Promise((resolve) => runner.on("exit", resolve));

killTree(server);
process.exit(code ?? 1);
