import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

// 'unsafe-eval' is required only for Next.js's own dev-mode tooling (React's
// dev-time stack-trace reconstruction via eval()) — never used in production.
const scriptSrc = isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";

// Cloudflare Turnstile (see src/lib/captcha.ts, src/components/ui/Turnstile.tsx)
// loads a script and renders a challenge iframe from this origin, and the
// widget itself calls back to it — all three CSP directives below need to
// allow it, or the widget silently fails to render/verify in production.
const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Isolates our browsing context from other origins' windows/tabs (blocks
  // some cross-window timing/reference attacks). Safe here since the app
  // never relies on cross-origin window.opener interaction (no OAuth popups).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `${scriptSrc} ${TURNSTILE_ORIGIN}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self' ${TURNSTILE_ORIGIN}`,
      `frame-src ${TURNSTILE_ORIGIN}`,
      "frame-ancestors 'none'",
      // base-uri/form-action don't fall back to default-src like the fetch
      // directives above — left unset, they're unrestricted regardless of
      // default-src, letting an injected <base> tag or a hijacked <form
      // action> point anywhere.
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Removes the `X-Powered-By: Next.js` header — no functional benefit to
  // advertising the framework/version to every request.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default withNextIntl(nextConfig);
