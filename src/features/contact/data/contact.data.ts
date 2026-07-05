import { prisma } from "@/lib/prisma";

export function getContactMessages() {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}

export function getNewMessageCount() {
  return prisma.contactMessage.count({ where: { status: "NEW" } });
}
