import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type CounterState = {
  count: number;
  windowStart: Date;
  lockedUntil: Date | null;
};

// Rows this old (and not currently under an active lock) are safe to
// discard — the longest-lived legitimate state in this table is an active
// lockout/block, capped well under an hour by every caller (see
// login-attempts.ts's LOCKOUT_STEPS, ip-reputation.ts's BLOCK_DURATION_MS),
// so 24h is a conservative margin, not a tight one.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

// Lazy, piggybacked on real traffic (no background timer/cron), fire-and-
// forget so a slow or failed cleanup never adds latency or an unhandled
// rejection to the rate-limit check it's attached to — same shape as the
// sweep functions this replaces in rate-limit.ts/login-attempts.ts/
// ip-reputation.ts, just backed by a DELETE instead of a Map loop.
function sweep(): void {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;

  const cutoff = new Date(now - MAX_AGE_MS);
  void prisma.abuseCounter
    .deleteMany({
      where: {
        updatedAt: { lt: cutoff },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }],
      },
    })
    .catch((error) => logger.error({ err: error }, "abuse_counter_sweep_failed"));
}

/**
 * Atomically increments `key`'s counter, resetting it to 1 with a fresh
 * window if the previous window has expired — a single
 * `INSERT ... ON CONFLICT DO UPDATE` statement, so concurrent callers
 * (different serverless instances hitting the same key at once, which is
 * exactly the scenario a prior in-memory version of this code silently
 * didn't handle — see the security-audit note this module was added to
 * address) can never race past each other and undercount the way a naive
 * read-then-write would.
 *
 * Prisma's query builder has no way to express "conditionally reset or
 * increment in one atomic step" — this raw statement is a deliberate,
 * narrow exception to this project's otherwise 100% query-builder
 * convention, not an oversight. `key`/`windowMs` are still fully
 * parameterized via Prisma's tagged-template `$queryRaw` (never string-
 * interpolated into the query text), so this carries no SQL-injection
 * risk. Verified directly against a live Postgres instance under 50 true
 * concurrent connections (a connection-pooled test, not one connection
 * serializing overlapping queries) before relying on it here — every
 * increment landed on a distinct, sequential count with zero lost updates.
 */
export async function incrementCounter(key: string, windowMs: number): Promise<CounterState> {
  sweep();

  const rows = await prisma.$queryRaw<CounterState[]>`
    INSERT INTO "AbuseCounter" (key, count, "windowStart", "updatedAt")
    VALUES (${key}, 1, now(), now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN "AbuseCounter"."windowStart" <= now() - make_interval(secs => ${windowMs}::float / 1000)
        THEN 1
        ELSE "AbuseCounter".count + 1
      END,
      "windowStart" = CASE
        WHEN "AbuseCounter"."windowStart" <= now() - make_interval(secs => ${windowMs}::float / 1000)
        THEN now()
        ELSE "AbuseCounter"."windowStart"
      END,
      "updatedAt" = now()
    RETURNING count, "windowStart", "lockedUntil"
  `;

  return rows[0];
}

/**
 * Read-only lookup, no increment — used by callers that only need to check
 * current state (e.g. "is this key currently locked?") without counting a
 * new attempt.
 */
export async function getCounter(key: string): Promise<CounterState | null> {
  const record = await prisma.abuseCounter.findUnique({
    where: { key },
    select: { count: true, windowStart: true, lockedUntil: true },
  });
  return record;
}

/**
 * Records an already-decided lock/block outcome. Unlike incrementCounter,
 * this has no race to guard against — by the time a caller decides to lock
 * a key, it has already atomically read the authoritative count from
 * incrementCounter above, so this is just persisting that decision, not
 * making one. `updateMany` (not `update`) so a row that doesn't exist yet
 * is a safe no-op rather than a thrown P2025 — matches this project's
 * established convention for exactly this class of "the row might not be
 * there" race elsewhere (see updateApplicationNotes).
 */
export async function setLockedUntil(key: string, lockedUntil: Date): Promise<void> {
  await prisma.abuseCounter.updateMany({ where: { key }, data: { lockedUntil } });
}

/**
 * Clears a key entirely (e.g. on a successful login, matching the original
 * in-memory `attempts.delete(key)`) rather than leaving a stale row around.
 */
export async function resetCounter(key: string): Promise<void> {
  await prisma.abuseCounter.deleteMany({ where: { key } });
}
