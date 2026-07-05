import { useLocale, useTranslations } from "next-intl";
import { MapPin, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { JobPosting } from "@/generated/prisma/client";

type JobCardData = Pick<
  JobPosting,
  "slug" | "titleAr" | "titleEn" | "field" | "location" | "jobType"
>;

export function JobCard({ job }: { job: JobCardData }) {
  const locale = useLocale();
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const title = locale === "ar" ? job.titleAr : job.titleEn;

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        {job.field && <Badge tone="mint">{job.field}</Badge>}
        <Badge tone="primary">{t(`jobType.${job.jobType}`)}</Badge>
      </div>
      <h3 className="mt-4 text-lg font-bold text-primary-800">{title}</h3>
      {job.location && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-primary-900/60">
          <MapPin className="h-4 w-4" />
          {job.location}
        </p>
      )}
      <Link
        href={`/jobs/${job.slug}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
      >
        {tCommon("viewDetails")}
        <ArrowLeft className="h-4 w-4 rotate-180 rtl:rotate-0" />
      </Link>
    </Card>
  );
}
