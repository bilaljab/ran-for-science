import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedJobs } from "@/features/jobs/data/jobs.data";
import { Hero } from "@/components/home/Hero";
import { ServiceHighlights } from "@/components/home/ServiceHighlights";
import { CtaSection } from "@/components/home/CtaSection";
import { JobCard } from "@/features/jobs/components/JobCard";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import type { JobPosting } from "@/generated/prisma/client";

type FeaturedJob = Pick<JobPosting, "slug" | "titleAr" | "titleEn" | "field" | "location" | "jobType">;

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

function FeaturedJobs({ jobs }: { jobs: FeaturedJob[] }) {
  const t = useTranslations("home.featuredJobs");

  if (jobs.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary-800 sm:text-3xl">{t("title")}</h2>
        <Link href="/jobs" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
          {t("viewAll")}
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.slug} job={job} />
        ))}
      </div>
    </section>
  );
}
