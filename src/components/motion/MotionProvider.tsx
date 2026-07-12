"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

// Mounted once, at the locale layout level. Every descendant must use the
// `m` component (never `motion`) so framer-motion's animation/gesture code
// is lazy-loaded instead of bundled in full — `strict` throws in dev if
// `motion.*` is used anywhere under this provider, which is the intended
// enforcement mechanism for keeping that true over time.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
