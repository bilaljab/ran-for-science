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

// Pure (no DB) so it can be unit-tested. `maxLockMs` caps the result: keys
// that any third party can drive without being the account owner (the
// account-wide email key) must not be allowed to escalate past the mildest
// tier, or knowing an admin's email is enough to lock them out for an hour.
export function lockMsFor(failures: number, maxLockMs = Infinity): number {
  let lock = 0;
  for (const step of LOCKOUT_STEPS) if (failures >= step.afterFailures) lock = step.lockMs;
  return Math.min(lock, maxLockMs);
}
