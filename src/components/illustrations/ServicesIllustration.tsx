"use client";

// Hand-authored illustration — no raster/external assets, brand colors only,
// gated on prefers-reduced-motion via usePathDraw/useFloat. Hub-and-spoke
// motif with 4 outer nodes mirroring the site's 4 paid-service categories.

import { m } from "framer-motion";
import { usePathDraw, useFloat } from "./useIllustrationMotion";

const SPOKES = [
  { x: 160, y: 40, color: "var(--color-mint-400)" }, // top
  { x: 280, y: 160, color: "var(--color-primary-400)" }, // right
  { x: 160, y: 280, color: "var(--color-mauve-400)" }, // bottom
  { x: 40, y: 160, color: "var(--color-primary-300)" }, // left
];

export function ServicesIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={className} aria-hidden="true">
      {SPOKES.map((spoke, i) => (
        <Spoke key={i} x={spoke.x} y={spoke.y} color={spoke.color} delay={0.15 * i} />
      ))}
      <circle cx={160} cy={160} r={26} fill="var(--color-primary-500)" />
    </svg>
  );
}

function Spoke({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  const line = usePathDraw(delay, 0.8);
  const node = useFloat(4, 4 + delay, delay);

  return (
    <>
      <m.line x1={160} y1={160} x2={x} y2={y} stroke={color} strokeWidth={3} strokeLinecap="round" {...line} />
      <m.circle cx={x} cy={y} r={16} fill={color} {...node} />
    </>
  );
}
