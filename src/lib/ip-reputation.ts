import { logAbuseEvent } from "@/lib/abuse-log";
import { recordSuspiciousFingerprint } from "@/lib/fingerprint";
import type { FingerprintScope } from "@/generated/prisma/enums";

type Strike = { count: number; windowStart: number; blockedUntil: number };

const strikes = new Map<string, Strike>();

const STRIKE_WINDOW_MS = 60 * 60 * 1000; // violations older than this stop counting
const BLOCK_THRESHOLD = 8; // distinct rate-limit violations across ANY endpoint
const BLOCK_DURATION_MS = 60 * 60 * 1000;

const MAX_ENTRIES = 50_000;
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60 * 1000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [ip, strike] of strikes) {
    if (now > strike.blockedUntil && now - strike.windowStart > STRIKE_WINDOW_MS) strikes.delete(ip);
  }
  if (strikes.size > MAX_ENTRIES) {
    const excess = strikes.size - MAX_ENTRIES / 2;
    let i = 0;
    for (const ip of strikes.keys()) {
      if (i++ >= excess) break;
      strikes.delete(ip);
    }
  }
}

/**
 * Minimal, self-contained reputation tracker: an IP that keeps tripping rate
 * limits — on any endpoint, not just one — gets a blanket block across every
 * rate-limited surface for a cooldown period, instead of just the one bucket
 * it happened to exceed. This is deliberately a narrow interface
 * (`isIpBlocked`/`recordRateLimitViolation`) so a real external reputation
 * feed (Cloudflare, IPQualityScore, etc.) can be dropped in behind it later
 * without touching any call site.
 */
export function isIpBlocked(ip: string): boolean {
  if (ip === "unknown") return false;
  const strike = strikes.get(ip);
  return !!strike && Date.now() < strike.blockedUntil;
}

export function recordRateLimitViolation(
  ip: string,
  source: string,
  scope: FingerprintScope,
  fingerprint?: string
): void {
  if (ip === "unknown") return;
  const now = Date.now();
  sweep(now);

  const strike = strikes.get(ip);
  if (!strike || now - strike.windowStart > STRIKE_WINDOW_MS) {
    strikes.set(ip, { count: 1, windowStart: now, blockedUntil: 0 });
    return;
  }

  strike.count += 1;
  if (strike.count >= BLOCK_THRESHOLD && now >= strike.blockedUntil) {
    strike.blockedUntil = now + BLOCK_DURATION_MS;
    logAbuseEvent({ type: "ip_blocked", ip, detail: `source=${source} strikes=${strike.count}` });
    if (fingerprint) {
      void recordSuspiciousFingerprint(fingerprint, scope, `ip_blocked source=${source}`);
    }
  }
}
