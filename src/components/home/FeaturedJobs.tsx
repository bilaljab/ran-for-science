"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { JobCard } from "@/features/jobs/components/JobCard";
import type { JobPosting } from "@/generated/prisma/client";

type FeaturedJob = Pick<JobPosting, "slug" | "titleAr" | "titleEn" | "field" | "location" | "jobType">;

export function FeaturedJobs({ jobs }: { jobs: FeaturedJob[] }) {
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
      <StaggerGrid className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <StaggerItem key={job.slug}>
            <JobCard job={job} />
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}
