import { logAbuseEvent } from "@/lib/abuse-log";
import { recordSuspiciousFingerprint } from "@/lib/fingerprint";
import { incrementCounter, getCounter, setLockedUntil, resetCounter } from "@/lib/abuse-counter";
import { lockMsFor } from "@/lib/lockout-tiers";
import type { FingerprintScope } from "@/generated/prisma/enums";

const FAILURE_WINDOW_MS = 15 * 60 * 1000;

// The mildest lockout tier (5 failures / 60s) fires easily from ordinary
// mistakes (a mistyped password, an MFA typo, or deliberately testing the
// lockout itself) — escalating a 30-day cross-context fingerprint block from
// that alone punished legitimate admins too readily. Reserve the fingerprint
// escalation for the second tier and up.
const FINGERPRINT_ESCALATION_THRESHOLD = 8;

/**
 * Progressive account/IP lockout, independent of and in addition to the
 * fixed-window per-source rate limiter in lib/rate-limit.ts. Keying this by
 * email (account-level) catches credential stuffing that rotates through
 * many IPs against one known account; keying a second instance by bare IP
 * (see auth.ts) catches password-spraying that rotates through many emails
 * from one source — neither pattern trips a same-key fixed-window limiter
 * on its own.
 *
 * The account-wide email key is capped (`maxLockMs`) at the mildest tier,
 * because anyone who knows an admin's email can feed it failures from any
 * IP; letting it escalate would be a cheap lockout-DoS against that admin.
 * The long tiers live on email+IP and bare-IP keys, which only the attacking
 * source can escalate for itself.
 */
export async function getLockoutRemainingMs(key: string): Promise<number> {
  const state = await getCounter(`login:${key}`);
  if (!state?.lockedUntil) return 0;
  const remaining = state.lockedUntil.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * `scope` is required, not defaulted to "ADMIN" — this module's lockout
 * mechanics are generic (keyed by whatever `key` the caller passes) and
 * nothing here actually guarantees every caller is admin-login code. A
 * hardcoded default would silently re-escalate into the wrong
 * BlockedFingerprint namespace the moment a second, non-admin consumer
 * (e.g. a future partner-portal login or public account-recovery lockout)
 * reused this otherwise-generic module — exactly the cross-contamination bug
 * the ADMIN/PUBLIC scope split exists to prevent. Forcing every call site to
 * pass it explicitly keeps that choice visible and reviewable.
 */
export async function recordLoginFailure(
  key: string,
  ip: string,
  label: string,
  scope: FingerprintScope,
  fingerprint?: string,
  maxLockMs?: number
): Promise<void> {
  const { count: failures } = await incrementCounter(`login:${key}`, FAILURE_WINDOW_MS);

  const lockMs = lockMsFor(failures, maxLockMs);
  if (lockMs > 0) {
    await setLockedUntil(`login:${key}`, new Date(Date.now() + lockMs));
    logAbuseEvent({ type: "login_lockout", ip, detail: `${label} failures=${failures} lockMs=${lockMs}` });
    // Never on a capped (account-wide) key: anyone can feed it failures, so
    // they say nothing about this device and would punish the real admin.
    if (fingerprint && maxLockMs === undefined && failures >= FINGERPRINT_ESCALATION_THRESHOLD) {
      void recordSuspiciousFingerprint(fingerprint, scope, `login_lockout ${label}`);
    }
  }
}

export async function recordLoginSuccess(key: string): Promise<void> {
  await resetCounter(`login:${key}`);
}
