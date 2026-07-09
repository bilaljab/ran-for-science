import { logAbuseEvent } from "@/lib/abuse-log";
import { recordSuspiciousFingerprint } from "@/lib/fingerprint";

type AttemptState = { failures: number; windowStart: number; lockedUntil: number };

const attempts = new Map<string, AttemptState>();

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

const MAX_ENTRIES = 50_000;
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60 * 1000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, state] of attempts) {
    if (now > state.lockedUntil && now - state.windowStart > FAILURE_WINDOW_MS) attempts.delete(key);
  }
  if (attempts.size > MAX_ENTRIES) {
    const excess = attempts.size - MAX_ENTRIES / 2;
    let i = 0;
    for (const key of attempts.keys()) {
      if (i++ >= excess) break;
      attempts.delete(key);
    }
  }
}

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
export function getLockoutRemainingMs(key: string): number {
  const state = attempts.get(key);
  if (!state) return 0;
  const remaining = state.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function recordLoginFailure(key: string, ip: string, label: string, fingerprint?: string): void {
  const now = Date.now();
  sweep(now);

  let state = attempts.get(key);
  if (!state || now - state.windowStart > FAILURE_WINDOW_MS) {
    state = { failures: 0, windowStart: now, lockedUntil: 0 };
  }

  state.failures += 1;
  const lockMs = currentLockMs(state.failures);
  if (lockMs > 0) {
    state.lockedUntil = now + lockMs;
    logAbuseEvent({ type: "login_lockout", ip, detail: `${label} failures=${state.failures} lockMs=${lockMs}` });
    if (fingerprint && state.failures >= FINGERPRINT_ESCALATION_THRESHOLD) {
      void recordSuspiciousFingerprint(fingerprint, "ADMIN", `login_lockout ${label}`);
    }
  }
  attempts.set(key, state);
}

export function recordLoginSuccess(key: string): void {
  attempts.delete(key);
}
