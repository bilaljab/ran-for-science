import "server-only";
import { logAbuseEvent } from "@/lib/abuse-log";
import { incrementCounter, getCounter, setLockedUntil } from "@/lib/abuse-counter";
import type { FingerprintScope } from "@/generated/prisma/enums";

const STRIKE_WINDOW_MS = 60 * 60 * 1000; // violations older than this stop counting
const BLOCK_THRESHOLD = 8; // distinct rate-limit violations across endpoints of ONE scope
const BLOCK_DURATION_MS = 60 * 60 * 1000;

/**
 * Minimal, self-contained reputation tracker: an IP that keeps tripping rate
 * limits — on any endpoint of one scope, not just one — gets a blanket block
 * across every rate-limited surface of THAT scope for a cooldown period,
 * instead of just the one bucket it happened to exceed. Keyed per scope so
 * abuse of the public forms can't lock the same IP (a shared NAT, say) out of
 * admin login, and vice versa. Violations deliberately never write a
 * persistent fingerprint block: `fp` is client-supplied, so a rate-limit
 * strike is no proof the fingerprint belongs to the abuser, and the 1h IP
 * block already covers the abuse. This is deliberately a narrow interface
 * (`isIpBlocked`/`recordRateLimitViolation`) so a real external reputation
 * feed (Cloudflare, IPQualityScore, etc.) can be dropped in behind it later
 * without touching any call site.
 */
export async function isIpBlocked(ip: string, scope: FingerprintScope): Promise<boolean> {
  if (ip === "unknown") return false;
  const strike = await getCounter(`ip-rep:${scope}:${ip}`);
  return !!strike?.lockedUntil && Date.now() < strike.lockedUntil.getTime();
}

export async function recordRateLimitViolation(
  ip: string,
  source: string,
  scope: FingerprintScope
): Promise<void> {
  if (ip === "unknown") return;

  const key = `ip-rep:${scope}:${ip}`;
  const { count, lockedUntil } = await incrementCounter(key, STRIKE_WINDOW_MS);
  const now = Date.now();
  const alreadyBlocked = !!lockedUntil && now < lockedUntil.getTime();

  if (count >= BLOCK_THRESHOLD && !alreadyBlocked) {
    await setLockedUntil(key, new Date(now + BLOCK_DURATION_MS));
    logAbuseEvent({ type: "ip_blocked", ip, detail: `source=${source} scope=${scope} strikes=${count}` });
  }
}
