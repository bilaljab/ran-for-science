"use client";

// Hand-authored illustration — no raster/external assets, brand colors only,
// gated on prefers-reduced-motion via usePathDraw/useFloat.

import { m } from "framer-motion";
import { usePathDraw, useFloat } from "./useIllustrationMotion";

export function ContactIllustration({ className }: { className?: string }) {
  const flap = usePathDraw(0.2, 0.9);
  const sentLine = usePathDraw(0.6, 0.8);
  const dot = useFloat(6, 4, 0.4);

  return (
    <svg viewBox="0 0 320 280" className={className} aria-hidden="true">
      <rect x={60} y={80} width={200} height={140} rx={12} fill="white" stroke="var(--color-primary-300)" strokeWidth={3} />
      <m.path
        d="M 60 92 L 160 170 L 260 92"
        fill="none"
        stroke="var(--color-primary-400)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...flap}
      />
      <m.path
        d="M 220 80 C 250 60, 260 50, 270 40"
        fill="none"
        stroke="var(--color-mauve-400)"
        strokeWidth={3}
        strokeDasharray="6 6"
        strokeLinecap="round"
        {...sentLine}
      />
      <m.circle cx={270} cy={40} r={10} fill="var(--color-mauve-400)" {...dot} />
    </svg>
  );
}
