"use client";

import { m, useReducedMotion } from "framer-motion";

type GradientOrbProps = {
  className?: string;
  colors?: [string, string];
};

// Purely decorative ambient blob built from this project's own CSS
// variables (see src/app/globals.css) — no image assets, no WebGL.
export function GradientOrb({
  className,
  colors = ["var(--color-primary-200)", "var(--color-mint-200)"],
}: GradientOrbProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      aria-hidden="true"
      className={className}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${colors[0]} 0%, ${colors[1]} 45%, transparent 70%)`,
        filter: "blur(60px)",
      }}
      animate={
        prefersReducedMotion ? undefined : { scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -15, 0] }
      }
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
