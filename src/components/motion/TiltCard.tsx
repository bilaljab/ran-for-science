"use client";

// Adapted from motion-primitives' Tilt component (@ibelick), MIT License,
// sourced via 21st.dev (https://21st.dev/@ibelick/components/tilt).
// Modifications: swapped `motion` for `m` (LazyMotion, see
// MotionProvider.tsx); added `useReducedMotion()` gating and a
// touch-device `matchMedia('(hover: hover) and (pointer: fine)')` guard,
// neither of which exist upstream; added an optional composed `Spotlight`
// companion driven by the same tracked pointer position instead of its
// own independent listener.

import { useRef, useState, useCallback, useSyncExternalStore, type MouseEvent as ReactMouseEvent } from "react";
import {
  m,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
  type SpringOptions,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Spotlight } from "./Spotlight";

const DEFAULT_SPRING: SpringOptions = { stiffness: 300, damping: 25, mass: 0.5 };

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeToHoverCapability(callback: () => void) {
  const mql = window.matchMedia(HOVER_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getHoverCapabilitySnapshot() {
  return window.matchMedia(HOVER_QUERY).matches;
}

function getHoverCapabilityServerSnapshot() {
  return false;
}

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  rotationFactor?: number;
  spotlight?: boolean;
  springOptions?: SpringOptions;
};

export function TiltCard({
  children,
  className,
  rotationFactor = 8,
  spotlight = false,
  springOptions = DEFAULT_SPRING,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  // Subscribes to the browser's own hover-capability media query rather
  // than a useState+useEffect pair — this is React's documented pattern
  // for reading external browser state (avoids a synchronous setState
  // inside an effect body). `getServerSnapshot` returns `false`, so SSR
  // and first paint never assume hover capability (no hydration mismatch);
  // it only flips true once the browser confirms it client-side.
  const canHoverDevice = useSyncExternalStore(
    subscribeToHoverCapability,
    getHoverCapabilitySnapshot,
    getHoverCapabilityServerSnapshot
  );
  const [isHovered, setIsHovered] = useState(false);

  const shouldAnimate = canHoverDevice && !prefersReducedMotion;

  // Normalized [-0.5, 0.5] position, used for the tilt rotation.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, springOptions);
  const ySpring = useSpring(y, springOptions);
  const rotateX = useTransform(ySpring, [-0.5, 0.5], [rotationFactor, -rotationFactor]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-rotationFactor, rotationFactor]);
  const transform = useMotionTemplate`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  // Raw pixel position, shared with the optional Spotlight companion —
  // the only place either component reads/writes pointer position.
  const pixelX = useMotionValue(0);
  const pixelY = useMotionValue(0);

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      x.set(mouseX / rect.width - 0.5);
      y.set(mouseY / rect.height - 0.5);
      pixelX.set(mouseX);
      pixelY.set(mouseY);
    },
    [x, y, pixelX, pixelY]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }, [x, y]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const spotlightElement = spotlight ? (
    <Spotlight mouseX={pixelX} mouseY={pixelY} isHovered={isHovered && shouldAnimate} canHover={shouldAnimate} />
  ) : null;

  if (!shouldAnimate) {
    return (
      <div className={cn("relative", className)}>
        {spotlightElement}
        {children}
      </div>
    );
  }

  return (
    <m.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d", transform }}
      className={cn("relative will-change-transform", className)}
    >
      {spotlightElement}
      {children}
    </m.div>
  );
}
