import { prisma } from "@/lib/prisma";
import { JobType, ApplicationStatus } from "@/generated/prisma/enums";
import { idSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

// Free-text query-param filter (e.g. `?field=...`). Prisma parameterizes the
// query so this can't lead to injection, but an unbounded attacker-supplied
// string is still rejected: it can't match any real `field` value anyway,
// and capping it stops abuse/oversized-query attempts and keeps it safe to
// log or reflect back in the UI's `defaultValue`.
const MAX_FILTER_LENGTH = 100;

function sanitizeFilter(value?: string): string | undefined {
  if (!value || value.length > MAX_FILTER_LENGTH) return undefined;
  return value;
}

const jobCardSelect = {
  slug: true,
  titleAr: true,
  titleEn: true,
  field: true,
  location: true,
  jobType: true,
} as const;

export function getPublishedJobs({
  field,
  jobType,
  take,
}: { field?: string; jobType?: string; take?: number } = {}) {
  const jobTypeValues = Object.values(JobType) as string[];
  const safeField = sanitizeFilter(field);

  const where: Prisma.JobPostingWhereInput = {
    status: "PUBLISHED",
    ...(safeField ? { field: safeField } : {}),
    ...(jobType && jobTypeValues.includes(jobType)
      ? { jobType: jobType as (typeof JobType)[keyof typeof JobType] }
      : {}),
  };

  return prisma.jobPosting.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    select: jobCardSelect,
    ...(take ? { take } : {}),
  });
}

export function getPublishedJobFields() {
  return prisma.jobPosting.findMany({
    where: { status: "PUBLISHED", field: { not: null } },
    select: { field: true },
    distinct: ["field"],
  });
}

export function getPublishedJobBySlug(slug: string) {
  return prisma.jobPosting.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export function getAdminJobs() {
  return prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
}

export function getJobById(id: string) {
  return prisma.jobPosting.findUnique({ where: { id } });
}

export function getJobApplications({ jobId, status }: { jobId?: string; status?: string } = {}) {
  const validJobId = jobId && idSchema.safeParse(jobId).success ? jobId : undefined;
  const validStatus =
    status && Object.values(ApplicationStatus).includes(status as ApplicationStatus) ? status : undefined;

  return prisma.jobApplication.findMany({
    where: {
      ...(validJobId ? { jobId: validJobId } : {}),
      ...(validStatus ? { status: validStatus as ApplicationStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { job: { select: { titleAr: true } } },
  });
}

export function getJobTitlesForFilter() {
  return prisma.jobPosting.findMany({ select: { id: true, titleAr: true }, orderBy: { createdAt: "desc" } });
}

export function getJobApplicationDetail(id: string) {
  return prisma.jobApplication.findUnique({
    where: { id },
    include: { job: { select: { titleAr: true } } },
  });
}

export function getJobApplicationResume(id: string) {
  return prisma.jobApplication.findUnique({ where: { id } });
}

export async function getJobDashboardCounts() {
  const [publishedJobs, pendingApplications] = await Promise.all([
    prisma.jobPosting.count({ where: { status: "PUBLISHED" } }),
    prisma.jobApplication.count({ where: { status: "PENDING" } }),
  ]);
  return { publishedJobs, pendingApplications };
}
