"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

async function guardAdmin(source: string) {
  const session = await requireAdmin();
  return { adminUserId: session.user.id, source };
}

// A non-exported helper is not an endpoint, so it needs no guard.
async function helperWithoutGuard(id: string) {
  return prisma.jobPosting.findUnique({ where: { id } });
}

// ruleid: admin-action-must-require-admin
export async function deleteNoGuard(id: string) {
  await prisma.jobPosting.deleteMany({ where: { id } });
}

// ruleid: admin-action-must-require-admin
export async function prismaBeforeGuard(id: string) {
  const row = await prisma.jobPosting.findUnique({ where: { id } });
  await requireAdmin();
  return row;
}

// ruleid: admin-action-must-require-admin
export async function guardAfterWork(id: string) {
  const parsed = String(id).trim();
  const admin = await guardAdmin("x");
  await prisma.jobPosting.deleteMany({ where: { id: parsed } });
  return admin;
}

// ruleid: admin-action-must-require-admin
export async function guardOnlyInBranch(id: string, check: boolean) {
  if (check) {
    await requireAdmin();
  }
  await prisma.jobPosting.deleteMany({ where: { id } });
}

// ruleid: admin-action-must-require-admin
export async function guardNeverCalled(id: string) {
  const fn = requireAdmin;
  void fn;
  return helperWithoutGuard(id);
}

// ok: admin-action-must-require-admin
export async function deleteWithRequireAdmin(id: string) {
  await requireAdmin();
  await prisma.jobPosting.deleteMany({ where: { id } });
}

// ok: admin-action-must-require-admin
export async function updateKeepingSession(id: string, status: string) {
  const session = await requireAdmin();
  await prisma.jobPosting.updateMany({ where: { id }, data: { status, by: session.user.id } });
}

// ok: admin-action-must-require-admin
export async function updateWithGuardAdmin(id: string) {
  const admin = await guardAdmin("admin-update");
  if (!admin) return;
  await prisma.jobPosting.deleteMany({ where: { id } });
}

// ok: admin-action-must-require-admin
export async function bareGuardAdmin(id: string) {
  await guardAdmin("admin-bare");
  await prisma.jobPosting.deleteMany({ where: { id } });
}
