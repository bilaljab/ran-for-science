import { logAbuseEvent } from "@/lib/abuse-log";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile verification for the public, unauthenticated forms
 * (contact/quote/apply) — the ones spam bots actually target. Optional by
 * design, same pattern as the email adapter: without TURNSTILE_SECRET_KEY,
 * verification is skipped so local development doesn't require a Cloudflare
 * account. This is additive to the existing honeypot + rate limiting, not a
 * replacement — configure it before relying on it as your primary defense
 * in production.
 *
 * Graceful Fallback: a real "the token was invalid" result (Cloudflare
 * responded, verification failed) fails CLOSED — that's a genuine rejection.
 * But if Cloudflare's own verification service is unreachable (network error,
 * an outage on their end), failing closed would reject every legitimate
 * submission across the whole site for as long as the outage lasts. That
 * case fails OPEN instead, falling back on the honeypot/rate-limit/IP-
 * reputation/fingerprint layers, with a loud, distinct log line so a real
 * outage is still visible and alertable.
 */
export async function verifyCaptcha(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[captcha] TURNSTILE_SECRET_KEY is not set in production — CAPTCHA verification is being skipped " +
          "on all public forms. Configure it to enable bot protection."
      );
    } else {
      console.warn("[captcha] TURNSTILE_SECRET_KEY not set — skipping CAPTCHA verification (dev only).");
    }
    return true;
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return false;
  }

  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data: { success?: boolean } = await res.json();
    return data.success === true;
  } catch (error) {
    logAbuseEvent({ type: "captcha_degraded", ip, detail: `verification service unreachable: ${error}` });
    return true;
  }
}
