import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedJobs } from "@/features/jobs/data/jobs.data";
import { Hero } from "@/components/home/Hero";
import { ServiceHighlights } from "@/components/home/ServiceHighlights";
import { CtaSection } from "@/components/home/CtaSection";
import { FeaturedJobs } from "@/components/home/FeaturedJobs";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });
  const title = t("title");
  const description = t("subtitle");

  return {
    title,
    description,
    alternates: buildAlternates(locale, "/"),
    openGraph: buildOpenGraph({ title, description, locale, path: "/" }),
    twitter: buildTwitter({ title, description }),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const jobs = await getPublishedJobs({ take: 3 });

  return (
    <>
      <Hero />
      <ServiceHighlights />
      <FeaturedJobs jobs={jobs} />
      <CtaSection />
    </>
  );
}
