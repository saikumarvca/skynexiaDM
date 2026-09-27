import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const startedAt = Date.now();

/**
 * GET /api/health — liveness + readiness for load balancers and uptime
 * monitors. Public (no session), never cached. 200 when the database answers
 * a ping within 2s, 503 otherwise. Deliberately reveals no configuration.
 */
export async function GET() {
  let db: "up" | "down" = "down";
  let latencyMs: number | null = null;
  const t0 = Date.now();
  try {
    await Promise.race([
      dbConnect().then(() => mongoose.connection.db?.admin().ping()),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
    db = "up";
    latencyMs = Date.now() - t0;
  } catch {
    db = "down";
  }

  const ok = db === "up";
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      db,
      dbLatencyMs: latencyMs,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
