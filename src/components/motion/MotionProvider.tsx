"use client";

import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

// Async import puts the framer-motion feature bundle in a separate chunk that
// loads after the critical render path, keeping it out of the initial JS
// evaluation and reducing TBT. Every descendant must use `m.*` (never
// `motion.*`) — `strict` enforces this at dev time.
const loadFeatures = () => import("./dom-features").then((m) => m.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
