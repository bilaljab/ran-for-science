"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";

// Only fires when the root layout itself throws (a render error above the
// [locale] segment, e.g. in [locale]/layout.tsx) — Next.js requires this
// file to render its own <html>/<body> since it replaces the entire tree,
// including the layout that would otherwise provide next-intl's locale
// context. Kept deliberately bilingual and dependency-free (no useTranslations,
// no shared layout components) since none of that context can be trusted
// to exist at this point.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error-boundary]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 1rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>حدث خطأ غير متوقع / Something went wrong</p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", opacity: 0.7 }}>
            حاول تحديث الصفحة، أو تواصل معنا إذا استمرت المشكلة.
            <br />
            Please refresh the page, or contact us if the problem persists.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: "2rem", padding: "0.625rem 1.5rem", borderRadius: "0.375rem", background: "#296e7a", color: "white", border: "none", cursor: "pointer" }}
          >
            حاول مرة أخرى / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
