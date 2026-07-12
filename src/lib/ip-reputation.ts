import { logAbuseEvent } from "@/lib/abuse-log";
import { recordSuspiciousFingerprint } from "@/lib/fingerprint";
import { incrementCounter, getCounter, setLockedUntil } from "@/lib/abuse-counter";
import type { FingerprintScope } from "@/generated/prisma/enums";

const STRIKE_WINDOW_MS = 60 * 60 * 1000; // violations older than this stop counting
const BLOCK_THRESHOLD = 8; // distinct rate-limit violations across ANY endpoint
const BLOCK_DURATION_MS = 60 * 60 * 1000;

/**
 * Minimal, self-contained reputation tracker: an IP that keeps tripping rate
 * limits — on any endpoint, not just one — gets a blanket block across every
 * rate-limited surface for a cooldown period, instead of just the one bucket
 * it happened to exceed. This is deliberately a narrow interface
 * (`isIpBlocked`/`recordRateLimitViolation`) so a real external reputation
 * feed (Cloudflare, IPQualityScore, etc.) can be dropped in behind it later
 * without touching any call site.
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (ip === "unknown") return false;
  const strike = await getCounter(`ip-rep:${ip}`);
  return !!strike?.lockedUntil && Date.now() < strike.lockedUntil.getTime();
}

export async function recordRateLimitViolation(
  ip: string,
  source: string,
  scope: FingerprintScope,
  fingerprint?: string
): Promise<void> {
  if (ip === "unknown") return;

  const { count, lockedUntil } = await incrementCounter(`ip-rep:${ip}`, STRIKE_WINDOW_MS);
  const now = Date.now();
  const alreadyBlocked = !!lockedUntil && now < lockedUntil.getTime();

  if (count >= BLOCK_THRESHOLD && !alreadyBlocked) {
    await setLockedUntil(`ip-rep:${ip}`, new Date(now + BLOCK_DURATION_MS));
    logAbuseEvent({ type: "ip_blocked", ip, detail: `source=${source} strikes=${count}` });
    if (fingerprint) {
      void recordSuspiciousFingerprint(fingerprint, scope, `ip_blocked source=${source}`);
    }
  }
}
