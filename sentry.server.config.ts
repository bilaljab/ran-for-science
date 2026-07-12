import * as Sentry from "@sentry/nextjs";

// 10% of transactions, not 100%: this is a low-traffic corporate site, so
// full tracing would burn through Sentry's transaction quota for little
// added value, while 10% still gives a representative sample of real
// performance data (slow queries, slow Server Actions). This does NOT
// affect error capture — every exception is still reported regardless of
// this value, since error and performance sampling are independent in the
// Sentry SDK. Revisit upward later if traffic grows and quota allows it.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
