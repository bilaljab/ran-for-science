"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { workshopSchema } from "@/features/workshops/validations/workshop.schema";
import type { ActionState } from "@/lib/actions/types";

// Same shared `admin-mutate:` key as every other admin mutation (see
// features/jobs/actions/admin.actions.ts for why it is not per-feature).
const ADMIN_MUTATE_LIMIT = 100;
const ADMIN_MUTATE_WINDOW_MS = 5 * 60 * 1000;

async function guardAdmin(source: string) {
  const session = await requireAdmin();
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`admin-mutate:${session.user.id}`, ADMIN_MUTATE_LIMIT, ADMIN_MUTATE_WINDOW_MS, {
    ip,
    source,
    scope: "ADMIN",
  });
  return allowed ? { adminUserId: session.user.id, ip } : null;
}

function parseWorkshopForm(formData: FormData) {
  return workshopSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    typeLabel: formData.get("typeLabel"),
    presenterName: formData.get("presenterName"),
    workshopDate: formData.get("workshopDate"),
    durationMinutes: formData.get("durationMinutes"),
  });
}

const TOO_MANY = { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." } as const;

export async function createWorkshop(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await guardAdmin("admin-workshop-create");
  if (!admin) return TOO_MANY;

  const parsed = parseWorkshopForm(formData);
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  // Left empty, the slug is generated (8 random hex chars: short and not guessable).
  const slug = parsed.data.slug || `ws-${randomUUID().slice(0, 8)}`;
  if (await prisma.workshop.findUnique({ where: { slug }, select: { id: true } })) {
    return { success: false, errors: { slug: ["هذا الرابط مستخدم لورشة أخرى"] } };
  }

  const workshop = await prisma.workshop.create({ data: { ...parsed.data, slug } });

  await logAdminAction({ ...admin, action: "workshop.create", entityType: "Workshop", entityId: workshop.id });

  revalidatePath("/admin/workshops");
  redirect("/admin/workshops");
}

export async function updateWorkshop(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await guardAdmin("admin-workshop-update");
  if (!admin) return TOO_MANY;

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { success: false, message: "الورشة غير موجودة" };

  const parsed = parseWorkshopForm(formData);
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  // An empty slug on edit keeps the current one (the link may already be shared).
  const slug = parsed.data.slug || undefined;
  if (slug) {
    const clash = await prisma.workshop.findUnique({ where: { slug }, select: { id: true } });
    if (clash && clash.id !== parsedId.data) {
      return { success: false, errors: { slug: ["هذا الرابط مستخدم لورشة أخرى"] } };
    }
  }

  const { count } = await prisma.workshop.updateMany({ where: { id: parsedId.data }, data: { ...parsed.data, slug } });
  if (count === 0) return { success: false, message: "الورشة غير موجودة" };

  await logAdminAction({ ...admin, action: "workshop.update", entityType: "Workshop", entityId: parsedId.data });

  revalidatePath("/admin/workshops");
  redirect("/admin/workshops");
}

export async function deleteWorkshop(id: string) {
  const admin = await guardAdmin("admin-workshop-delete");
  const parsedId = idSchema.safeParse(id);
  if (!admin || !parsedId.success) return;

  await prisma.workshop.deleteMany({ where: { id: parsedId.data } });

  await logAdminAction({ ...admin, action: "workshop.delete", entityType: "Workshop", entityId: parsedId.data });

  revalidatePath("/admin/workshops");
}

// The 10-minute (configurable) attendance window starts HERE, at the click —
// not at the scheduled workshop time — because the admin posts the link in the
// Zoom chat right after pressing it.
export async function openRegistration(id: string) {
  const admin = await guardAdmin("admin-workshop-open");
  const parsedId = idSchema.safeParse(id);
  if (!admin || !parsedId.success) return;

  const workshop = await prisma.workshop.findUnique({ where: { id: parsedId.data } });
  if (!workshop) return;

  const now = new Date();
  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { opensAt: now, closesAt: new Date(now.getTime() + workshop.durationMinutes * 60_000) },
  });

  await logAdminAction({ ...admin, action: "workshop.open", entityType: "Workshop", entityId: workshop.id });

  revalidatePath("/admin/workshops");
}

export async function closeRegistration(id: string) {
  const admin = await guardAdmin("admin-workshop-close");
  const parsedId = idSchema.safeParse(id);
  if (!admin || !parsedId.success) return;

  // Only an already-opened window can be closed; `closesAt` alone must never
  // make a never-opened workshop look "closed".
  await prisma.workshop.updateMany({
    where: { id: parsedId.data, opensAt: { not: null } },
    data: { closesAt: new Date() },
  });

  await logAdminAction({ ...admin, action: "workshop.close", entityType: "Workshop", entityId: parsedId.data });

  revalidatePath("/admin/workshops");
}
