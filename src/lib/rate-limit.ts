import { isIP } from "net";
import { headers } from "next/headers";
import { isIpBlocked, recordRateLimitViolation } from "@/lib/ip-reputation";
import { logAbuseEvent } from "@/lib/abuse-log";
import type { FingerprintScope } from "@/generated/prisma/enums";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Every rate-limit key is ultimately derived from client-controlled input
// (an IP-ish string, an email, etc). Without a cap, an attacker who keeps
// changing that input generates a fresh Map entry per request forever and
// old entries are never removed — an unbounded-memory DoS. This sweep runs
// lazily (piggy-backed on real traffic, no background timer) and bounds
// both how stale an entry can get and how large the map can grow.
const MAX_BUCKETS = 50_000;
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60 * 1000;

function sweepExpiredBuckets(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
  if (buckets.size > MAX_BUCKETS) {
    // Still over budget after sweeping expired entries (e.g. under active
    // attack) — drop the oldest half rather than let memory grow further.
    const excess = buckets.size - MAX_BUCKETS / 2;
    let i = 0;
    for (const key of buckets.keys()) {
      if (i++ >= excess) break;
      buckets.delete(key);
    }
  }
}

/**
 * In-memory fixed-window rate limiter. Good enough at current traffic levels;
 * if the app moves to multiple server instances, swap the Map for a shared
 * store (e.g. Redis) since each instance would otherwise track its own counts.
 *
 * `reputation`, when passed, feeds violations into the IP-reputation tracker
 * (see lib/ip-reputation.ts) and rejects up front if that IP is already
 * under a blanket block from repeatedly abusing *other* endpoints. Its
 * optional `fingerprint` is forwarded so that if this violation is the one
 * that actually crosses the IP-block threshold, that specific device gets
 * flagged too (see lib/fingerprint.ts) — not just its current IP.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  reputation?: { ip: string; source: string; scope: FingerprintScope; fingerprint?: string }
): boolean {
  const now = Date.now();
  sweepExpiredBuckets(now);

  if (reputation && isIpBlocked(reputation.ip)) {
    logAbuseEvent({ type: "blocked_ip_rejected", ip: reputation.ip, detail: `source=${reputation.source}` });
    return false;
  }

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    if (reputation) recordRateLimitViolation(reputation.ip, reputation.source, reputation.scope, reputation.fingerprint);
    return false;
  }

  bucket.count += 1;
  return true;
}

// `x-forwarded-for`/`x-real-ip` are ordinary request headers: unless a
// trusted reverse proxy in front of this app overwrites them, their value is
// entirely attacker-controlled. We can't know the exact hosting setup from
// here, so this does the best it can from source alone:
//   1. Take only the first comma-separated hop (the original client, by
//      convention) and require it to actually parse as an IPv4/IPv6 address
//      — garbage/oversized/injected values fall back to "unknown" instead of
//      being used as-is (which would otherwise let an attacker mint
//      unlimited distinct rate-limit buckets with junk strings).
//   2. This does NOT stop an attacker from rotating through spoofed-but-valid
//      IP strings to bypass rate limiting by IP — that requires the hosting
//      platform to guarantee the header is proxy-set, which must be
//      configured at the infra layer, not here.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const candidate = forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip");
  return candidate && isIP(candidate) ? candidate : "unknown";
}
