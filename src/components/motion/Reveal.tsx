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

  const variants: Variants = {
    hidden: { opacity: 0, y: yOffset, filter: `blur(${blur})` },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
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
