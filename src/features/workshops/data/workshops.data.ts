import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const ADMIN_LIST_SAFETY_CAP = 200;
const RESPONSES_SAFETY_CAP = 5000;

export async function getAdminWorkshops() {
  // Independent queries run in parallel: every Postgres round trip costs
  // hundreds of ms in production (see the note on PUBLIC_JOBS_TAG in jobs.data.ts).
  const [workshops, averages] = await Promise.all([
    prisma.workshop.findMany({
      orderBy: { workshopDate: "desc" },
      take: ADMIN_LIST_SAFETY_CAP,
      include: { _count: { select: { responses: true } } },
    }),
    prisma.workshopResponse.groupBy({
      by: ["workshopId"],
      _avg: { workshopRating: true, presenterRating: true },
    }),
  ]);
  const averageByWorkshop = new Map(averages.map((a) => [a.workshopId, a._avg]));

  return workshops.map((workshop) => ({
    ...workshop,
    responseCount: workshop._count.responses,
    averageWorkshopRating: averageByWorkshop.get(workshop.id)?.workshopRating ?? null,
  }));
}

// Authoritative, uncached lookup — used where correctness matters (the submit
// action's registration-window check).
export function getWorkshopBySlug(slug: string) {
  return prisma.workshop.findUnique({ where: { slug } });
}

// Display-only lookup for the public page, served from Next's Data Cache so a
// whole cohort opening the link at once doesn't each pay a slow Postgres round
// trip. Invalidated on every admin mutation (updateTag(WORKSHOPS_TAG) in
// admin.actions.ts), `revalidate` is only a safety net. Cached values are JSON,
// so dates travel as ISO strings and are revived below.
export const WORKSHOPS_TAG = "workshops";

const SLUG_PATTERN = /^[a-z0-9-]{3,60}$/;

export async function getPublicWorkshop(slug: string) {
  // Malformed slugs never reach the DB or create a cache entry.
  if (!SLUG_PATTERN.test(slug)) return null;

  const cached = await unstable_cache(
    async () => {
      const workshop = await prisma.workshop.findUnique({ where: { slug } });
      if (!workshop) return null;
      return {
        id: workshop.id,
        slug: workshop.slug,
        title: workshop.title,
        typeLabel: workshop.typeLabel,
        presenterName: workshop.presenterName,
        workshopDate: workshop.workshopDate.toISOString(),
        opensAt: workshop.opensAt?.toISOString() ?? null,
        closesAt: workshop.closesAt?.toISOString() ?? null,
      };
    },
    ["public-workshop", slug],
    { tags: [WORKSHOPS_TAG], revalidate: 300 }
  )();

  if (!cached) return null;
  return {
    ...cached,
    workshopDate: new Date(cached.workshopDate),
    opensAt: cached.opensAt ? new Date(cached.opensAt) : null,
    closesAt: cached.closesAt ? new Date(cached.closesAt) : null,
  };
}

export function getWorkshopForAdmin(id: string) {
  return prisma.workshop.findUnique({ where: { id } });
}

export function getResponses(workshopId: string) {
  return prisma.workshopResponse.findMany({
    where: { workshopId },
    orderBy: { createdAt: "desc" },
    take: RESPONSES_SAFETY_CAP,
  });
}

// True only when `responseId` exists AND belongs to `workshopId` — a cookie from
// one workshop must never unlock another workshop's certificate page.
export async function responseBelongsToWorkshop(workshopId: string, responseId: string) {
  const found = await prisma.workshopResponse.findFirst({ where: { id: responseId, workshopId }, select: { id: true } });
  return found !== null;
}

export async function getWorkshopStats(workshopId: string) {
  const where = { workshopId };
  const [aggregate, byEducation, byStatus, byBenefit, recommendCount] = await Promise.all([
    prisma.workshopResponse.aggregate({
      where,
      _count: true,
      _avg: { workshopRating: true, presenterRating: true },
    }),
    prisma.workshopResponse.groupBy({ by: ["education"], where, _count: true }),
    prisma.workshopResponse.groupBy({ by: ["currentStatus"], where, _count: true }),
    prisma.workshopResponse.groupBy({ by: ["benefit"], where, _count: true }),
    prisma.workshopResponse.count({ where: { ...where, recommend: true } }),
  ]);

  return {
    total: aggregate._count,
    averageWorkshopRating: aggregate._avg.workshopRating,
    averagePresenterRating: aggregate._avg.presenterRating,
    recommendCount,
    education: byEducation.map((row) => ({ label: row.education, count: row._count })),
    currentStatus: byStatus.map((row) => ({ label: row.currentStatus, count: row._count })),
    benefit: byBenefit.map((row) => ({ label: row.benefit, count: row._count })),
  };
}

// The response id is the unguessable certificate token — expose only what the
// certificate itself prints, nothing else from the submission.
export function getCertificateData(responseId: string) {
  return prisma.workshopResponse.findUnique({
    where: { id: responseId },
    select: {
      fullName: true,
      workshop: {
        select: { slug: true, title: true, typeLabel: true, presenterName: true, workshopDate: true },
      },
    },
  });
}
