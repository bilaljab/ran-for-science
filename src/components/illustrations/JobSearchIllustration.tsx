"use client";

// Hand-authored illustration — no raster/external assets, brand colors only,
// gated on prefers-reduced-motion via usePathDraw/useFloat.

import { m } from "framer-motion";
import { usePathDraw, useFloat } from "./useIllustrationMotion";

export function JobSearchIllustration({ className }: { className?: string }) {
  const glassRing = usePathDraw(0.2, 0.9);
  const glassHandle = usePathDraw(0.5, 0.4);
  const float = useFloat(5, 5, 0.2);

  return (
    <svg viewBox="0 0 320 280" className={className} aria-hidden="true">
      <rect x={60} y={60} width={140} height={170} rx={10} fill="var(--color-mint-100)" transform="rotate(-6 130 145)" />
      <rect x={75} y={45} width={140} height={170} rx={10} fill="var(--color-primary-100)" transform="rotate(3 145 130)" />
      <rect x={90} y={30} width={140} height={170} rx={10} fill="white" stroke="var(--color-primary-200)" strokeWidth={2} />
      <rect x={110} y={55} width={100} height={8} rx={4} fill="var(--color-primary-200)" />
      <rect x={110} y={75} width={80} height={8} rx={4} fill="var(--color-primary-100)" />
      <rect x={110} y={95} width={90} height={8} rx={4} fill="var(--color-primary-100)" />

      <m.g {...float}>
        <m.circle cx={220} cy={180} r={38} fill="none" stroke="var(--color-primary-500)" strokeWidth={8} {...glassRing} />
        <m.line
          x1={246}
          y1={206}
          x2={280}
          y2={240}
          stroke="var(--color-primary-500)"
          strokeWidth={10}
          strokeLinecap="round"
          {...glassHandle}
        />
      </m.g>
    </svg>
  );
}
