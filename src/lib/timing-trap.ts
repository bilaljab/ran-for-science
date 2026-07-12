// Tuned low deliberately: some legitimate users fill these forms very fast
// via a password manager/browser autofill, and a threshold set too high
// would reject them. This is meant to catch scripted submissions that skip
// realistic human fill time entirely, not to be a strict human/bot boundary
// on its own — it works alongside the honeypot, CAPTCHA, and rate limiter,
// not instead of them.
const MIN_HUMAN_SUBMIT_MS = 600;

/**
 * A missing or malformed timestamp is treated the same as "too fast": these
 * forms already require client JS to submit at all (Server Actions wired
 * through useActionState), so a real browser submission always carries a
 * real value here — an absent one means the request skipped our client code
 * entirely (a direct scripted POST to the action).
 */
export function isTooFast(formRenderedAt: FormDataEntryValue | null): boolean {
  const renderedAt = Number(formRenderedAt);
  if (!Number.isFinite(renderedAt) || renderedAt <= 0) return true;
  return Date.now() - renderedAt < MIN_HUMAN_SUBMIT_MS;
}
