"use client";

import { useLocale } from "next-intl";

// Small RTL-aware hover-nudge for the existing `ArrowLeft` icons (which are
// already CSS-flipped via `rotate-180 rtl:rotate-0`). Forward direction is
// reversed in RTL, so the nudge offset must flip sign to match — framer-
// motion's x/rotate values are inline styles, not Tailwind classes, so this
// can't be handled with an `rtl:` variant the way the icon rotation is.
export function useArrowMotion() {
  const locale = useLocale();
  const dir = locale === "ar" ? -1 : 1;
  return { whileHover: { x: 4 * dir } };
}
