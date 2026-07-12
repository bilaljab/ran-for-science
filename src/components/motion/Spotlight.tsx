"use client";

// Adapted from motion-primitives' Spotlight component (@ibelick), MIT
// License, sourced via 21st.dev as the companion to Tilt
// (https://21st.dev/@ibelick/components/tilt). Modifications: swapped
// `motion` for `m` (LazyMotion, see MotionProvider.tsx), and removed the
// upstream's own parentElement-discovery mousemove/mouseenter/mouseleave
// listeners in favor of receiving mouse position, hover state, and
// hover-capability as props from a parent (TiltCard) that already tracks
// the pointer — this is the only pointer-tracking site, so Spotlight can
// never independently decide to track the cursor when its parent has
// decided not to (e.g. on a touch-only device).

import { m, useSpring, useMotionTemplate, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  isHovered: boolean;
  canHover: boolean;
  size?: number;
  className?: string;
};

export function Spotlight({ mouseX, mouseY, isHovered, canHover, size = 200, className }: SpotlightProps) {
  const smoothX = useSpring(mouseX, { bounce: 0 });
  const smoothY = useSpring(mouseY, { bounce: 0 });
  // GPU-composited transform instead of animating left/top directly — the
  // static negative offset below centers the spotlight on the tracked
  // point, and only `transform` (not layout) changes per frame.
  const transform = useMotionTemplate`translate3d(${smoothX}px, ${smoothY}px, 0)`;

  if (!canHover) return null;

  return (
    <m.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops),transparent_80%)] from-primary-100 via-primary-50/60 to-transparent blur-xl transition-opacity duration-200",
        isHovered ? "opacity-70" : "opacity-0",
        className
      )}
      style={{ width: size, height: size, left: -size / 2, top: -size / 2, transform }}
    />
  );
}
