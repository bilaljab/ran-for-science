import { isIP } from "net";
import { headers } from "next/headers";
import { isIpBlocked, recordRateLimitViolation } from "@/lib/ip-reputation";
import { logAbuseEvent } from "@/lib/abuse-log";
import { incrementCounter } from "@/lib/abuse-counter";
import type { FingerprintScope } from "@/generated/prisma/enums";

/**
 * Fixed-window rate limiter backed by the shared, persistent AbuseCounter
 * table (see lib/abuse-counter.ts) — previously an in-memory Map, which a
 * security audit flagged as not surviving Vercel's serverless, multi-
 * instance model (each instance had its own empty counter, so spreading
 * requests across instances bypassed the limit almost entirely).
 *
 * `reputation`, when passed, feeds violations into the IP-reputation tracker
 * (see lib/ip-reputation.ts) and rejects up front if that IP is already
 * under a blanket block from repeatedly abusing *other* endpoints. Its
 * optional `fingerprint` is forwarded so that if this violation is the one
 * that actually crosses the IP-block threshold, that specific device gets
 * flagged too (see lib/fingerprint.ts) — not just its current IP.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  reputation?: { ip: string; source: string; scope: FingerprintScope; fingerprint?: string }
): Promise<boolean> {
  if (reputation && (await isIpBlocked(reputation.ip))) {
    logAbuseEvent({ type: "blocked_ip_rejected", ip: reputation.ip, detail: `source=${reputation.source}` });
    return false;
  }

  // incrementCounter always increments (even once past the limit), unlike
  // the old Map version which stopped incrementing at `limit` — harmless:
  // the allow/reject decision below is unaffected, and it makes the stored
  // count reflect the true attempt count under sustained abuse.
  const { count } = await incrementCounter(`ratelimit:${key}`, windowMs);

  if (count > limit) {
    if (reputation) await recordRateLimitViolation(reputation.ip, reputation.source, reputation.scope, reputation.fingerprint);
    return false;
  }

  return true;
}

// This project deploys to Vercel (see README/CLAUDE.md). Verified against
// Vercel's own documentation: Vercel's edge overwrites `x-forwarded-for`
// before a request reaches the serverless function and does not forward a
// client-supplied value through — spoofing this header requires Vercel's
// paid Enterprise "Verified Proxy" feature to explicitly allow it, which
// this project does not use. `x-vercel-forwarded-for` is Vercel's own,
// unambiguous name for the same guarantee, so it's checked first; the
// generic `x-forwarded-for`/`x-real-ip` fallback exists for local dev
// (`next dev`/`next start`, where neither Vercel header is present) and for
// the (currently untested) case of self-hosting behind a different
// reverse proxy — on a non-Vercel host, that fallback path is only as
// trustworthy as whatever proxy sits in front of it, which must be
// configured at the infra layer, not here.
//
// Either way: take only the first comma-separated hop and require it to
// actually parse as an IPv4/IPv6 address — garbage/oversized/injected
// values fall back to "unknown" instead of being used as-is (which would
// otherwise let an attacker mint unlimited distinct rate-limit buckets with
// junk strings).
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-vercel-forwarded-for") ?? h.get("x-forwarded-for");
  const candidate = forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip");
  return candidate && isIP(candidate) ? candidate : "unknown";
}
