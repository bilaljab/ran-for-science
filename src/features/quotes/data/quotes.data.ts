import { prisma } from "@/lib/prisma";
import { ServiceCategory, QuoteStatus } from "@/generated/prisma/enums";

export function getQuoteRequests({ category, status }: { category?: string; status?: string } = {}) {
  const validCategory = category && Object.values(ServiceCategory).includes(category as ServiceCategory) ? category : undefined;
  const validStatus = status && Object.values(QuoteStatus).includes(status as QuoteStatus) ? status : undefined;

  return prisma.serviceQuoteRequest.findMany({
    where: {
      ...(validCategory ? { category: validCategory as ServiceCategory } : {}),
      ...(validStatus ? { status: validStatus as QuoteStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getNewQuoteCount() {
  return prisma.serviceQuoteRequest.count({ where: { status: "NEW" } });
}
