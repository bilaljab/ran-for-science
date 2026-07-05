import { prisma } from "@/lib/prisma";

const BLOCK_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_FINGERPRINT_LENGTH = 128;

/**
 * Fingerprint escalation is deliberately transient-by-default: a normal
 * request's fingerprint is read from form data, checked against this table,
 * and discarded — never written here. A row only ever gets created when a
 * caller has ALREADY confirmed real abuse via an existing threshold
 * elsewhere (a login lockout engaging in lib/login-attempts.ts, or an
 * IP-reputation block in lib/ip-reputation.ts) — so a single call here
 * blocks immediately, rather than requiring a second independent strike
 * count at this layer too.
 *
 * The block is never permanent: `expiresAt` is (re)set to 30 days out on
 * every call, so continued abuse keeps pushing it forward, but a one-time
 * bad day — or a fingerprint collision with another device of the same
 * make/model/browser build — ages out automatically once the abuse stops.
 *
 * Privacy note: this deliberately does NOT store a fingerprint for every
 * visitor, only for devices that already tripped a real abuse threshold
 * elsewhere. This is honest, ready-to-adapt source material for a privacy
 * policy page describing this behavior — it is not itself a legal document.
 */
export async function recordSuspiciousFingerprint(fingerprint: string, reason: string): Promise<void> {
  if (!fingerprint || fingerprint.length > MAX_FINGERPRINT_LENGTH) return;

  try {
    const expiresAt = new Date(Date.now() + BLOCK_DURATION_MS);
    await prisma.blockedFingerprint.upsert({
      where: { fingerprint },
      create: { fingerprint, reason, blocked: true, expiresAt },
      update: { reason, blocked: true, expiresAt, strikes: { increment: 1 } },
    });
  } catch (error) {
    console.error("[fingerprint] failed to record suspicious fingerprint", error);
  }
}

/**
 * Fails open (treats as "not blocked") on any DB error or malformed input —
 * a bug/outage in this lookup must never block the contact/quote/apply/
 * login flow it's guarding. Same Graceful Fallback principle applied to the
 * external CAPTCHA check in lib/captcha.ts.
 */
export async function isKnownBadFingerprint(fingerprint: unknown): Promise<boolean> {
  if (typeof fingerprint !== "string" || !fingerprint || fingerprint.length > MAX_FINGERPRINT_LENGTH) {
    return false;
  }

  try {
    const record = await prisma.blockedFingerprint.findUnique({ where: { fingerprint } });
    return !!record && record.blocked && record.expiresAt > new Date();
  } catch (error) {
    console.error("[fingerprint] lookup failed, failing open", error);
    return false;
  }
}
