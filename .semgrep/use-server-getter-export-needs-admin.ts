"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

async function guardAdmin(source: string) {
  const session = await requireAdmin();
  return { adminUserId: session.user.id, source };
}

// A non-exported getter is not an endpoint.
async function getInternalRows() {
  return prisma.contactMessage.findMany();
}

// ruleid: use-server-getter-export-needs-admin
export async function getMessages() {
  return prisma.contactMessage.findMany();
}

// ruleid: use-server-getter-export-needs-admin
export async function listApplications(jobId: string) {
  return prisma.jobApplication.findMany({ where: { jobId } });
}

// ruleid: use-server-getter-export-needs-admin
export async function findQuote(id: string) {
  return prisma.serviceQuoteRequest.findUnique({ where: { id } });
}

// ruleid: use-server-getter-export-needs-admin
export async function getAfterWork(id: string) {
  const rows = await getInternalRows();
  await requireAdmin();
  return rows.filter((r) => r.id === id);
}

// ok: use-server-getter-export-needs-admin
export async function getGuarded() {
  await requireAdmin();
  return prisma.contactMessage.findMany();
}

// ok: use-server-getter-export-needs-admin
export async function listGuardedKeepingSession() {
  const session = await requireAdmin();
  return prisma.jobApplication.findMany({ where: { reviewedBy: session.user.id } });
}

// ok: use-server-getter-export-needs-admin
export async function findWithGuardAdmin(id: string) {
  const admin = await guardAdmin("find");
  if (!admin) return null;
  return prisma.serviceQuoteRequest.findUnique({ where: { id } });
}

// A mutation that is not named like a getter is covered by admin-action-must-require-admin, not this rule.
// ok: use-server-getter-export-needs-admin
export async function submitContact(name: string) {
  return prisma.contactMessage.create({ data: { name } });
}

// Lowercase continuation means a different word, not a getter.
// ok: use-server-getter-export-needs-admin
export async function getawayPlanner() {
  return null;
}
