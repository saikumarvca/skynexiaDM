import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

type RateLimitResult = { allowed: boolean; retryAfter?: number };

type RateLimitBackend = "memory" | "mongo";

function getBackend(): RateLimitBackend {
  // In-memory is fine for local/dev; Mongo-backed works in multi-instance deployments.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const configured = (process.env.RATE_LIMIT_BACKEND ?? "").toLowerCase();
  if (configured === "mongo") return "mongo";
  if (configured === "memory") return "memory";
  return process.env.NODE_ENV === "production" ? "mongo" : "memory";
}

// ---- memory backend (dev-only, per-process) ----
interface AttemptRecord {
  count: number;
  windowStart: number;
}
const attempts = new Map<string, AttemptRecord>();

function checkRateLimitMemory(key: string): RateLimitResult {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.windowStart >= WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

// ---- mongo backend (multi-instance safe) ----
type MongoRateLimitDoc = {
  _id: string; // `${key}:${bucketStartMs}`
  key: string;
  bucketStartMs: number;
  count: number;
  expiresAt: Date;
};

let ensureIndexPromise: Promise<void> | null = null;
async function ensureMongoIndexes() {
  if (ensureIndexPromise) return ensureIndexPromise;
  ensureIndexPromise = (async () => {
    await dbConnect();
    const col = mongoose.connection.db!.collection<MongoRateLimitDoc>("rate_limits");
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await col.createIndex({ key: 1, bucketStartMs: 1 });
  })();
  return ensureIndexPromise;
}

function getBucketStartMs(nowMs: number) {
  return Math.floor(nowMs / WINDOW_MS) * WINDOW_MS;
}

async function checkRateLimitMongo(key: string): Promise<RateLimitResult> {
  const nowMs = Date.now();
  const bucketStartMs = getBucketStartMs(nowMs);
  const bucketEndMs = bucketStartMs + WINDOW_MS;
  const id = `${key}:${bucketStartMs}`;

  await ensureMongoIndexes();
  const col = mongoose.connection.db!.collection<MongoRateLimitDoc>("rate_limits");

  const doc = await col.findOneAndUpdate(
    { _id: id },
    {
      $setOnInsert: {
        _id: id,
        key,
        bucketStartMs,
        expiresAt: new Date(bucketEndMs + WINDOW_MS), // extra buffer for clock skew
      },
      $inc: { count: 1 },
    },
    { upsert: true, returnDocument: "after" },
  );

  const count = doc?.count ?? 1;
  if (count > MAX_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((bucketEndMs - nowMs) / 1000));
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

export function checkRateLimit(key: string): RateLimitResult | Promise<RateLimitResult> {
  const backend = getBackend();
  if (backend === "mongo") return checkRateLimitMongo(key);
  return checkRateLimitMemory(key);
}
