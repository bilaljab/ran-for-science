import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Explicit allowlist, not a `!== "production"` negative check: any other
// value (unset, "test", a custom preview environment name) should get the
// strict CSP, not accidentally inherit 'unsafe-eval' by falling through a
// negative check.
const isDev = process.env.NODE_ENV === "development";

// 'unsafe-eval' is required only for Next.js's own dev-mode tooling (React's
// dev-time stack-trace reconstruction via eval()) — never used in production.
//
// 'unsafe-inline' on script-src is a known, deliberately-kept gap, not an
// oversight — researched against Next.js's own bundled CSP guide
// (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md)
// before deciding, per this project's AGENTS.md convention of checking that
// doc before writing Next.js-specific code:
//   - Nonce-based CSP (the docs' recommended replacement) requires EVERY
//     page using it to be dynamically rendered — "Static optimization and
//     Incremental Static Regeneration (ISR) are disabled." This project's
//     Home/About/Contact pages are currently statically generated (confirmed
//     via `npm run build` output: ● SSG). Switching to nonces would force
//     all of them to server-render on every request — slower loads, higher
//     hosting cost, and it would undo real Core Web Vitals work already
//     done on this site. That's a genuine architectural trade-off to accept
//     deliberately, not something to flip silently as a "security fix".
//   - Hash-based CSP (script-src 'sha256-...') was considered as a
//     lower-cost alternative for this project's two raw inline <script>
//     tags (speculation-rules in layout.tsx, JobPosting JSON-LD in
//     jobs/[slug]/page.tsx) — it works with static generation. But per the
//     CSP spec, the moment ANY hash or nonce source is present in a
//     directive, browsers ignore 'unsafe-inline' in that same directive
//     entirely (not "prefer the hash, fall back to unsafe-inline" — it's
//     fully dropped). The JSON-LD script's content is dynamic (a different
//     JobPosting per page), so it can't be pinned to one static hash the
//     way the fixed speculation-rules content could — meaning adding a hash
//     for one script would break the other, not just harden the first.
//   - Both existing inline scripts were independently verified safe by two
//     security-review passes: the JSON-LD content escapes `<` to `<`
//     (prevents `</script>` breakout even though the JobPosting title/
//     description come from admin-authored data), and the speculation-rules
//     content is a fixed, no-user-input constant. Today's actual exposure
//     from keeping 'unsafe-inline' is theoretical defense-in-depth, not a
//     live gap — which is why the safer, purely-additive mitigation below
//     (Subresource Integrity on Next's own bundled scripts) was implemented
//     now, while the nonce migration is left as a deliberate, documented,
//     conscious call for whoever revisits this with the static-generation
//     trade-off in mind, rather than something silently forced through here.
const scriptSrc = isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";

// Cloudflare Turnstile (see src/lib/captcha.ts, src/components/ui/Turnstile.tsx)
// loads a script and renders a challenge iframe from this origin, and the
// widget itself calls back to it — all three CSP directives below need to
// allow it, or the widget silently fails to render/verify in production.
const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

// Resume uploads PUT directly from the browser to R2 (see src/lib/storage.ts
// getResumeUploadUrl / src/features/jobs/actions/presign-resume.actions.ts) —
// bypassing our own server so large files aren't subject to Vercel's inbound
// serverless-function body-size cap. Wildcarded to cover both virtual-hosted
// (<bucket>.<account>.r2.cloudflarestorage.com) and path-style addressing
// without hardcoding the account ID into a build-time config file.
const R2_ORIGIN = "https://*.r2.cloudflarestorage.com";

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
      `connect-src 'self' ${TURNSTILE_ORIGIN} ${R2_ORIGIN}`,
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
      // Resume bytes now go straight from the browser to R2 via a presigned
      // URL (see src/lib/storage.ts) — no Server Action legitimately carries
      // a large file anymore, so this stays small as defense-in-depth.
      bodySizeLimit: "1mb",
    },
    // Adds `integrity` hashes to Next's own bundled framework/page script
    // tags, so a tampered/substituted script fails browser verification —
    // purely additive, works with static generation (unlike nonces), and
    // doesn't touch the CSP script-src decision documented above (it
    // hardens Next's own generated scripts; it doesn't help this project's
    // two hand-written inline <script> tags, which is why 'unsafe-inline'
    // is still needed for those specifically).
    sri: {
      algorithm: "sha256",
    },
  },
};

// Uploads source maps at build time so Sentry shows readable stack traces
// instead of minified ones — a no-op (silent skip, not a build failure) when
// SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT aren't set, so this is safe to
// ship before the user wires up those optional build-time credentials.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});
