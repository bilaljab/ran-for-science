"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { m, useReducedMotion } from "framer-motion";

// Next.js remounts `template.tsx` fresh on every navigation (unlike
// layout.tsx, which persists) — the framework's own purpose-built hook
// point for "play an entrance animation each time this route is visited."
//
// `lastPathname` is deliberately module-scoped, not component state: it
// must survive this component's own unmount/remount across navigations.
// The read (`shouldAnimate`, below) happens directly in the render body —
// a pure read with no mutation, safe under React's render-function
// double-invoke in dev. The write happens only inside `useEffect`, and
// effects never run during server rendering — so the server-side copy of
// `lastPathname` never changes and every server-rendered response (first
// load or a hard reload) deterministically computes `shouldAnimate: false`,
// with no risk of one request's navigation state leaking into another's.
// On the client, the write is an unconditional, idempotent assignment
// (`lastPathname = pathname`), which is safe under StrictMode's dev-only
// effect mount -> cleanup -> mount double-invoke: running it twice sets the
// same value both times.
let lastPathname: string | null = null;

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion && lastPathname !== null && lastPathname !== pathname;

  useEffect(() => {
    lastPathname = pathname;
  }, [pathname]);

  if (!shouldAnimate) {
    return <>{children}</>;
  }

  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      {children}
    </m.div>
  );
}
