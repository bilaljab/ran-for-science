import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedJobBySlug } from "@/features/jobs/data/jobs.data";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ApplyForm } from "@/features/jobs/components/ApplyForm";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";

const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// schema.org JobPosting has no "REMOTE" employment type — remote-ness is a
// location property (jobLocationType), not an employment type — so REMOTE
// maps to OTHER here and is handled separately via jobLocationType below.
const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
  REMOTE: "OTHER",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const job = await getPublishedJobBySlug(slug);
  if (!job) return {};

  const title = locale === "ar" ? job.titleAr : job.titleEn;
  const description = (locale === "ar" ? job.descriptionAr : job.descriptionEn).slice(0, 200);
  const path = `/jobs/${slug}`;

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: buildOpenGraph({ title, description, locale, path }),
    twitter: buildTwitter({ title, description }),
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const job = await getPublishedJobBySlug(slug);
  if (!job) notFound();

  const title = locale === "ar" ? job.titleAr : job.titleEn;
  const description = locale === "ar" ? job.descriptionAr : job.descriptionEn;
  const requirements = locale === "ar" ? job.requirementsAr : job.requirementsEn;

  // JobPosting structured data (Google for Jobs eligibility). Real fields
  // only — no fabricated data. addressCountry defaults to Saudi Arabia since
  // every listing on this site is SA-based (Saudi phone format, Riyadh/
  // Jeddah locations); adjust here first if that ever stops being true.
  const jobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    datePosted: (job.publishedAt ?? job.createdAt).toISOString(),
    ...(job.closesAt ? { validThrough: job.closesAt.toISOString() } : {}),
    employmentType: EMPLOYMENT_TYPE_MAP[job.jobType] ?? "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: "RAN For Science",
      sameAs: SITE_URL,
    },
    ...(job.jobType === "REMOTE"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "SA" } }
      : job.location
        ? {
            jobLocation: {
              "@type": "Place",
              address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "SA" },
            },
          }
        : {}),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Script
        id="job-posting-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        // Job title/description are admin-authored (not public user input —
        // see requireAdmin() on createJob/updateJob), but `<` is still
        // escaped to `<` so a literal "</script>" inside the text can
        // never prematurely close this tag and inject raw HTML/JS after it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="flex flex-wrap items-center gap-2">
        {job.field && <Badge tone="mint">{job.field}</Badge>}
        <Badge tone="primary">{t(`jobs.jobType.${job.jobType}`)}</Badge>
      </div>

      <h1 className="mt-4 text-3xl font-extrabold text-primary-800">{title}</h1>

      {job.location && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-primary-900/60">
          <MapPin className="h-4 w-4" />
          {job.location}
        </p>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-bold text-primary-700">{t("jobs.detail.description")}</h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-primary-900/80">{description}</p>
      </div>

      {requirements && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-primary-700">{t("jobs.detail.requirements")}</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-primary-900/80">{requirements}</p>
        </div>
      )}

      <div className="mt-12 rounded-xl border border-primary-100 bg-primary-50/40 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary-800">{t("jobs.detail.applyTitle")}</h2>
        <div className="mt-6">
          <ApplyForm jobId={job.id} />
        </div>
      </div>
    </div>
  );
}
