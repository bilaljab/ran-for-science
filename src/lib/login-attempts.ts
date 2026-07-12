import { logAbuseEvent } from "@/lib/abuse-log";
import { recordSuspiciousFingerprint } from "@/lib/fingerprint";
import { incrementCounter, getCounter, setLockedUntil, resetCounter } from "@/lib/abuse-counter";
import type { FingerprintScope } from "@/generated/prisma/enums";

const FAILURE_WINDOW_MS = 15 * 60 * 1000;

// The mildest lockout tier (5 failures / 60s) fires easily from ordinary
// mistakes (a mistyped password, an MFA typo, or deliberately testing the
// lockout itself) — escalating a 30-day cross-context fingerprint block from
// that alone punished legitimate admins too readily. Reserve the fingerprint
// escalation for the second tier and up.
const FINGERPRINT_ESCALATION_THRESHOLD = 8;

// Each step's lock duration applies once the failure count reaches it, and
// stays in effect (re-triggered on every subsequent failure) until the
// failure count resets after a clean window. This is what makes repeated
// abuse increasingly expensive instead of a flat wait-and-retry.
const LOCKOUT_STEPS: { afterFailures: number; lockMs: number }[] = [
  { afterFailures: 5, lockMs: 60 * 1000 },
  { afterFailures: 8, lockMs: 5 * 60 * 1000 },
  { afterFailures: 12, lockMs: 30 * 60 * 1000 },
  { afterFailures: 20, lockMs: 60 * 60 * 1000 },
];

function currentLockMs(failures: number): number {
  let lock = 0;
  for (const step of LOCKOUT_STEPS) if (failures >= step.afterFailures) lock = step.lockMs;
  return lock;
}

/**
 * Progressive account/IP lockout, independent of and in addition to the
 * fixed-window per-source rate limiter in lib/rate-limit.ts. Keying this by
 * email (account-level) catches credential stuffing that rotates through
 * many IPs against one known account; keying a second instance by bare IP
 * (see auth.ts) catches password-spraying that rotates through many emails
 * from one source — neither pattern trips a same-key fixed-window limiter
 * on its own.
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
  fingerprint?: string
): Promise<void> {
  const { count: failures } = await incrementCounter(`login:${key}`, FAILURE_WINDOW_MS);

  const lockMs = currentLockMs(failures);
  if (lockMs > 0) {
    await setLockedUntil(`login:${key}`, new Date(Date.now() + lockMs));
    logAbuseEvent({ type: "login_lockout", ip, detail: `${label} failures=${failures} lockMs=${lockMs}` });
    if (fingerprint && failures >= FINGERPRINT_ESCALATION_THRESHOLD) {
      void recordSuspiciousFingerprint(fingerprint, scope, `login_lockout ${label}`);
    }
  }
}

export async function recordLoginSuccess(key: string): Promise<void> {
  await resetCounter(`login:${key}`);
}
