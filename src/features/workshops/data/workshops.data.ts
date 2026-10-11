import { prisma } from "@/lib/prisma";

const ADMIN_LIST_SAFETY_CAP = 200;
const RESPONSES_SAFETY_CAP = 5000;

export async function getAdminWorkshops() {
  const workshops = await prisma.workshop.findMany({
    orderBy: { workshopDate: "desc" },
    take: ADMIN_LIST_SAFETY_CAP,
    include: { _count: { select: { responses: true } } },
  });

  const averages = await prisma.workshopResponse.groupBy({
    by: ["workshopId"],
    where: { workshopId: { in: workshops.map((w) => w.id) } },
    _avg: { workshopRating: true, presenterRating: true },
  });
  const averageByWorkshop = new Map(averages.map((a) => [a.workshopId, a._avg]));

  return workshops.map((workshop) => ({
    ...workshop,
    responseCount: workshop._count.responses,
    averageWorkshopRating: averageByWorkshop.get(workshop.id)?.workshopRating ?? null,
  }));
}

export function getWorkshopBySlug(slug: string) {
  return prisma.workshop.findUnique({ where: { slug } });
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
