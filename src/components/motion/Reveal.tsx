"use client";

// Adapted from magicui's Blur Fade component (@dillionverma), MIT License,
// sourced via 21st.dev (https://21st.dev/@dillionverma/components/blur-fade).
// Modifications: swapped `motion`/imperative useInView+AnimatePresence for
// the `m` component (LazyMotion, see MotionProvider.tsx) driven by
// `whileInView`, and added `useReducedMotion()` gating — the upstream
// component has neither.

import { m, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
  blur?: string;
};

export function Reveal({
  children,
  className,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  blur = "6px",
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  // No opacity in hidden state — opacity:0 delays LCP because Chrome waits
  // for the element to be visible before recording the paint time. Transform
  // and filter animations don't affect LCP, so we animate only those.
  const variants: Variants = {
    hidden: { y: yOffset, filter: `blur(${blur})` },
    visible: { y: 0, filter: "blur(0px)" },
  };

  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </m.div>
  );
}
