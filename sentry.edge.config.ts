import * as Sentry from "@sentry/nextjs";

// src/proxy.ts (locale routing + admin cookie gate) runs on the edge
// runtime — this covers errors thrown there. Same sampling rationale as
// sentry.server.config.ts.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
