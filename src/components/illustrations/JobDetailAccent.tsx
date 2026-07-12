"use client";

// Hand-authored illustration — no raster/external assets, brand colors only,
// gated on prefers-reduced-motion via usePathDraw/useFloat. Deliberately
// small and quiet (meant as a low-opacity corner accent, not a centerpiece).

import { m } from "framer-motion";
import { usePathDraw, useFloat } from "./useIllustrationMotion";

export function JobDetailAccent({ className }: { className?: string }) {
  const handle = usePathDraw(0.2, 0.7);
  const pin = useFloat(4, 4, 0);

  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <rect x={16} y={36} width={64} height={44} rx={6} fill="var(--color-primary-100)" />
      <rect x={16} y={36} width={64} height={14} rx={6} fill="var(--color-primary-200)" />
      <m.path
        d="M 34 36 v-10 a 6 6 0 0 1 6 -6 h16 a 6 6 0 0 1 6 6 v10"
        fill="none"
        stroke="var(--color-primary-400)"
        strokeWidth={4}
        strokeLinecap="round"
        {...handle}
      />
      <m.circle cx={78} cy={24} r={6} fill="var(--color-mint-400)" {...pin} />
    </svg>
  );
}
