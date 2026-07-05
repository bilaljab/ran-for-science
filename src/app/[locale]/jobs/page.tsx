import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedJobs, getPublishedJobFields } from "@/features/jobs/data/jobs.data";
import { JobCard } from "@/features/jobs/components/JobCard";
import { JobType } from "@/generated/prisma/enums";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "jobs" });
  const title = t("title");
  const description = t("subtitle");

  return {
    title,
    description,
    // Canonical always points to the clean, unfiltered URL — filter query
    // params (?field=, ?jobType=) must not create separate indexed/duplicate
    // pages.
    alternates: buildAlternates(locale, "/jobs"),
    openGraph: buildOpenGraph({ title, description, locale, path: "/jobs" }),
    twitter: buildTwitter({ title, description }),
  };
}

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ field?: string; jobType?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const { field, jobType } = await searchParams;
  const jobTypeValues = Object.values(JobType) as string[];

  const [jobs, fields] = await Promise.all([
    getPublishedJobs({ field, jobType }),
    getPublishedJobFields(),
  ]);

  return (
    <div>
      <section className="bg-primary-50/50 px-4 py-14 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold text-primary-800 sm:text-4xl">{t("jobs.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-primary-900/70">{t("jobs.subtitle")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <form className="flex flex-wrap gap-4" method="get">
          <select
            name="field"
            defaultValue={field ?? ""}
            className="rounded-md border border-primary-200 bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="">{t("jobs.filters.allFields")}</option>
            {fields.map((f) => (
              <option key={f.field} value={f.field ?? ""}>
                {f.field}
              </option>
            ))}
          </select>

          <select
            name="jobType"
            defaultValue={jobType ?? ""}
            className="rounded-md border border-primary-200 bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="">{t("jobs.filters.allTypes")}</option>
            {jobTypeValues.map((type) => (
              <option key={type} value={type}>
                {t(`jobs.jobType.${type}`)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-md bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            {t("common.submit")}
          </button>
        </form>

        {jobs.length === 0 ? (
          <p className="mt-12 text-center text-primary-900/60">{t("jobs.noResults")}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.slug} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
