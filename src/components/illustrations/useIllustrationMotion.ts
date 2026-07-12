"use client";

import { useReducedMotion } from "framer-motion";

// Path-draw-in: for m.path/m.circle stroke reveal on mount. Under reduced
// motion, skips straight to the fully-drawn state rather than animating.
export function usePathDraw(delay = 0, duration = 1.2) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return { initial: false as const, animate: { pathLength: 1 } };
  }

  return {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration, delay, ease: "easeInOut" as const },
  };
}

// Gentle infinite float for small accent shapes (dots, pins). Returns no
// motion props at all under reduced motion, leaving the shape static.
export function useFloat(offset = 6, duration = 4, delay = 0) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {};
  }

  return {
    animate: { y: [0, -offset, 0] },
    transition: { duration, delay, repeat: Infinity, ease: "easeInOut" as const },
  };
}
