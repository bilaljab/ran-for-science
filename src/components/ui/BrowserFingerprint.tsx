"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Best-effort, optional bot/device signal — if this fails to load (ad-blocker,
 * slow network, restrictive CSP) the hidden fields are simply left empty and
 * the form must still submit normally. This is never a hard requirement for
 * submission (Graceful Fallback principle). Fingerprints are only ever
 * persisted server-side for devices that already crossed a real abuse
 * threshold — see lib/fingerprint.ts.
 *
 * `fpBot` is written directly to the DOM via a ref inside useEffect, not
 * React state: a lazy useState initializer (or setting state synchronously
 * at the top of an effect) that reads `navigator` would compute one value
 * at prerender time and a different one on the real client, and React's
 * hydration keeps the server-prerendered value for the very first render —
 * silently discarding the client's real value forever on any statically-
 * generated page. An effect-driven ref write sidesteps that entirely.
 */
export function BrowserFingerprint() {
  const [fp, setFp] = useState("");
  const fpBotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    if (fpBotRef.current && navigator.webdriver === true) {
      fpBotRef.current.value = "1";
    }

    (async () => {
      try {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const agent = await FingerprintJS.load();
        const result = await agent.get();
        if (!cancelled) setFp(result.visitorId);
      } catch {
        // Left empty — see file-level comment.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <input type="hidden" name="fp" value={fp} readOnly />
      <input type="hidden" name="fpBot" ref={fpBotRef} defaultValue="" />
    </>
  );
}
