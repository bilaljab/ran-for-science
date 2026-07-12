"use client";

import { useTranslations } from "next-intl";
import { m, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { GradientOrb } from "@/components/motion/GradientOrb";

// Hero elements are above the fold — any opacity:0 initial state delays LCP
// by the full JS-hydration + animation-run time (~2.9 s in lab, measured).
// Transform-only animations don't block LCP paint, so we animate only `y`.
const textVariants: Variants = {
  hidden: { y: 16 },
  visible: (i: number) => ({
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.1 * i },
  }),
};

export function Hero() {
  const t = useTranslations("home.hero");
  const prefersReducedMotion = useReducedMotion();

  const initial = prefersReducedMotion ? undefined : "hidden";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
      <GradientOrb className="pointer-events-none absolute -top-24 -end-24 h-[28rem] w-[28rem] opacity-60" />
      <GradientOrb className="pointer-events-none absolute -bottom-32 -start-16 h-96 w-96 opacity-40" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-primary-800 sm:text-5xl">
          {t("title")}
        </h1>
        <m.p
          custom={0}
          initial={initial}
          animate="visible"
          variants={textVariants}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-900/70 sm:text-lg"
        >
          {t("subtitle")}
        </m.p>
        <m.div
          custom={1}
          initial={initial}
          animate="visible"
          variants={textVariants}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/jobs">
            <Button size="lg">{t("ctaJobs")}</Button>
          </Link>
          <Link href="/services">
            <Button size="lg" variant="outline">
              {t("ctaServices")}
            </Button>
          </Link>
        </m.div>
      </div>
    </section>
  );
}
