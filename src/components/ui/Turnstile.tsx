"use client";

import Script from "next/script";

/**
 * Renders nothing if no site key is configured (dev-friendly — no broken
 * widget locally). When present, Cloudflare's script auto-injects a hidden
 * `cf-turnstile-response` input into the enclosing <form>, so no extra
 * client-side wiring is needed beyond loading the script and rendering the
 * widget div inside the form.
 */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </>
  );
}
