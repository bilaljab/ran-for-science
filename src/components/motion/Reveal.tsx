"use client";

// Adapted from magicui's Blur Fade component (@dillionverma), MIT License,
// sourced via 21st.dev (https://21st.dev/@dillionverma/components/blur-fade).
// Modifications: swapped `motion`/imperative useInView+AnimatePresence for
// the `m` component (LazyMotion, see MotionProvider.tsx) driven by
// `whileInView`, added `useReducedMotion()` gating, and dropped the
// upstream's `filter: blur()` entirely — framer-motion renders the "hidden"
// variant into the server-rendered HTML, so the blur was visible on every
// page load for as long as hydration took (measured ~2.9s in this project,
// see Hero.tsx), not just for the animation's own duration. Same class of
// bug StaggerGrid.tsx already avoids by never animating opacity.

import { m, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
};

export function Reveal({ children, className, duration = 0.4, delay = 0, yOffset = 6 }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants: Variants = {
    hidden: { y: yOffset },
    visible: { y: 0 },
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
