import { logAbuseEvent } from "@/lib/abuse-log";
import { logger } from "@/lib/logger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Called once at server startup (see src/instrumentation.ts), mirroring
 * assertEmailConfigured()/assertStorageConfigured(). Fails fast in
 * production if CAPTCHA can't actually verify anything, instead of silently
 * skipping bot protection on every public form for as long as the
 * misconfiguration goes unnoticed in logs — the same "fail loud at boot,
 * not silently per-request" convention this project already applies to
 * email and storage.
 */
export function assertCaptchaConfigured(): void {
  if (process.env.NODE_ENV === "production" && !process.env.TURNSTILE_SECRET_KEY) {
    throw new Error(
      "TURNSTILE_SECRET_KEY is not set. Refusing to start in production without working CAPTCHA " +
        "verification (every public form's bot protection would otherwise silently no-op)."
    );
  }

  if (!process.env.TURNSTILE_SECRET_KEY) {
    logger.warn("captcha_turnstile_not_configured_dev_mode");
  }
}

/**
 * Cloudflare Turnstile verification for the public, unauthenticated forms
 * (contact/quote/apply) — the ones spam bots actually target. This is
 * additive to the existing honeypot + rate limiting, not a replacement.
 *
 * Graceful Fallback: a real "the token was invalid" result (Cloudflare
 * responded, verification failed) fails CLOSED — that's a genuine rejection.
 * But if Cloudflare's own verification service is unreachable (network error,
 * an outage on their end), failing closed would reject every legitimate
 * submission across the whole site for as long as the outage lasts. That
 * case fails OPEN instead, falling back on the honeypot/rate-limit/IP-
 * reputation/fingerprint layers, with a loud, distinct log line so a real
 * outage is still visible and alertable. This is a DIFFERENT case from a
 * missing secret key entirely — that's a deployment misconfiguration, not a
 * transient outage, which is why it's asserted at boot above instead of
 * silently tolerated here on every request.
 */
export async function verifyCaptcha(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Unreachable in a correctly configured production deployment —
    // assertCaptchaConfigured() already refused to boot without this env
    // var set. Local dev without a Turnstile account still reaches this,
    // intentionally.
    logger.warn("captcha_turnstile_not_configured_dev_mode");
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
