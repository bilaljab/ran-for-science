"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { GradientOrb } from "@/components/motion/GradientOrb";

export function CtaSection() {
  const t = useTranslations("home.cta");

  return (
    <section className="relative overflow-hidden bg-primary-700">
      <GradientOrb className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay" />
      <Reveal className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("title")}</h2>
        <p className="mt-4 text-primary-100">{t("subtitle")}</p>
        <m.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="mt-8 inline-block">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-white px-7 py-3 text-base font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            {t("button")}
          </Link>
        </m.div>
      </Reveal>
    </section>
  );
}
