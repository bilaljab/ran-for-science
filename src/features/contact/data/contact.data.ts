import { prisma } from "@/lib/prisma";

// Safety cap, not real pagination — bounds worst-case query cost as the
// table grows. Full pagination UI is a separate, larger task; this just
// stops an unbounded findMany from becoming a slow-query/OOM risk.
const ADMIN_LIST_SAFETY_CAP = 200;

export function getContactMessages() {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: ADMIN_LIST_SAFETY_CAP });
}

export function getNewMessageCount() {
  return prisma.contactMessage.count({ where: { status: "NEW" } });
}
