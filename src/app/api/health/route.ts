import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// pg driver adapter isn't edge-compatible, and this must never serve a
// cached/stale result — a health check that lies about the DB being up is
// worse than one that's slightly slower.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("health-check timeout")), ms)),
  ]);
}

export async function GET() {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, TIMEOUT_MS);
    return NextResponse.json({ status: "ok", db: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    // Real error detail goes to the logger/Sentry only — the public response
    // body stays generic (no DB error message or connection string).
    logger.error({ err: error }, "health_check_failed");
    return NextResponse.json(
      { status: "error", db: "error", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
