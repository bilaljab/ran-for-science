import { prisma } from "@/lib/prisma";
import { ServiceCategory, QuoteStatus } from "@/generated/prisma/enums";

// Safety cap, not real pagination — see contact.data.ts's identical comment.
const ADMIN_LIST_SAFETY_CAP = 200;

export function getQuoteRequests({ category, status }: { category?: string; status?: string } = {}) {
  const validCategory = category && Object.values(ServiceCategory).includes(category as ServiceCategory) ? category : undefined;
  const validStatus = status && Object.values(QuoteStatus).includes(status as QuoteStatus) ? status : undefined;

  return prisma.serviceQuoteRequest.findMany({
    where: {
      ...(validCategory ? { category: validCategory as ServiceCategory } : {}),
      ...(validStatus ? { status: validStatus as QuoteStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: ADMIN_LIST_SAFETY_CAP,
  });
}

export function getNewQuoteCount() {
  return prisma.serviceQuoteRequest.count({ where: { status: "NEW" } });
}
