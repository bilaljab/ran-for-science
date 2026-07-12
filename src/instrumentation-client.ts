import * as Sentry from "@sentry/nextjs";

// Client-side (browser) error/performance capture — separate DSN var since
// this bundle ships to the browser and must be NEXT_PUBLIC_-prefixed to be
// inlined at build time. Same 10% sampling rationale as the server config.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// Required by the SDK to instrument client-side route transitions (App
// Router navigations) as part of performance tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
