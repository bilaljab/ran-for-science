"use client";

// Hand-authored illustration — no raster/external assets, brand colors only
// (var(--color-*) CSS variables from src/app/globals.css), gated on
// prefers-reduced-motion via usePathDraw/useFloat.

import { m } from "framer-motion";
import { usePathDraw, useFloat } from "./useIllustrationMotion";

export function MissionIllustration({ className }: { className?: string }) {
  const path = usePathDraw(0.3, 1.4);
  const dot1 = useFloat(6, 3.5, 0);
  const dot2 = useFloat(5, 4, 0.4);
  const node1 = useFloat(4, 4.5, 0.1);
  const node2 = useFloat(4, 5, 0.3);

  return (
    <svg viewBox="0 0 360 360" className={className} aria-hidden="true">
      <m.path
        d="M 80 280 C 140 220, 180 160, 280 80"
        fill="none"
        stroke="var(--color-mauve-400)"
        strokeWidth={3}
        strokeDasharray="8 8"
        strokeLinecap="round"
        {...path}
      />
      <m.circle cx={150} cy={200} r={5} fill="var(--color-mauve-300)" {...dot1} />
      <m.circle cx={220} cy={130} r={4} fill="var(--color-mauve-300)" {...dot2} />
      <m.circle cx={80} cy={280} r={28} fill="var(--color-primary-400)" {...node1} />
      <m.circle cx={280} cy={80} r={22} fill="var(--color-mint-400)" {...node2} />
    </svg>
  );
}
