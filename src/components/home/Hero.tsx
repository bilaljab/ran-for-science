"use client";

import { useTranslations } from "next-intl";
import { m, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { GradientOrb } from "@/components/motion/GradientOrb";

const textVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.1 * i },
  }),
};

export function Hero() {
  const t = useTranslations("home.hero");
  const prefersReducedMotion = useReducedMotion();

  // `initial`/`animate`, deliberately not `whileInView`: the hero is above
  // the fold and its heading is almost certainly the LCP element — this
  // must animate immediately on mount, not wait on an IntersectionObserver,
  // and the opacity/transform-only fade doesn't delay when the real text
  // paints, only when it settles fully opaque.
  const initial = prefersReducedMotion ? undefined : "hidden";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
      <GradientOrb className="pointer-events-none absolute -top-24 -end-24 h-[28rem] w-[28rem] opacity-60" />
      <GradientOrb className="pointer-events-none absolute -bottom-32 -start-16 h-96 w-96 opacity-40" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <m.h1
          custom={0}
          initial={initial}
          animate="visible"
          variants={textVariants}
          className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-primary-800 sm:text-5xl"
        >
          {t("title")}
        </m.h1>
        <m.p
          custom={1}
          initial={initial}
          animate="visible"
          variants={textVariants}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-900/70 sm:text-lg"
        >
          {t("subtitle")}
        </m.p>
        <m.div
          custom={2}
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
