"use client";

import { useEffect, useRef } from "react";

/**
 * Records when the form became interactive, so the server can reject
 * submissions that arrive faster than any real human could plausibly fill
 * the form — see lib/timing-trap.ts for the threshold and rationale.
 *
 * Deliberately uses an uncontrolled ref + useEffect rather than
 * `useState(() => Date.now())`: a lazy useState initializer runs once at
 * prerender time on the server AND once on the client, producing two
 * different timestamps — and on a statically-generated page, React's
 * hydration keeps the server's (increasingly stale, as the server stays up
 * longer since its last build) value for the initial render, silently
 * discarding the client's real one. An effect only ever runs on the real
 * client after mount, so this always reflects genuine client-side timing.
 *
 * Speculation Rules (see src/app/[locale]/layout.tsx) can prerender this
 * page in a hidden background tab before the user ever navigates to it —
 * that would still run this effect early, at hover-time rather than at
 * actual page-view time, handing a bot (or a genuinely fast human) extra
 * "free" elapsed time before the visible page ever appears. If the page is
 * currently prerendering, defer starting the clock until it's actually
 * activated (the `prerenderingchange` event), matching when the user can
 * really first see and interact with the form.
 */
export function FormTimingGuard() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const setNow = () => {
      if (ref.current) ref.current.value = String(Date.now());
    };

    const doc = document as Document & { prerendering?: boolean };
    if (doc.prerendering) {
      document.addEventListener("prerenderingchange", setNow, { once: true });
      return () => document.removeEventListener("prerenderingchange", setNow);
    }

    setNow();
  }, []);

  return <input type="hidden" name="formRenderedAt" ref={ref} defaultValue="" />;
}
