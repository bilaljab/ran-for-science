"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";
import { getClientIp } from "@/lib/rate-limit";
import { deleteResumeFile } from "@/lib/storage";
import type { ActionState } from "@/lib/actions/types";
import { ApplicationStatus } from "@/generated/prisma/enums";

const applicationStatusValues = Object.values(ApplicationStatus) as [string, ...string[]];

const notesSchema = z.object({
  status: z.enum(applicationStatusValues),
  adminNotes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export async function updateApplicationStatus(id: string, status: string): Promise<boolean> {
  const session = await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success || !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
    return false;
  }

  await prisma.jobApplication.updateMany({
    where: { id: parsedId.data },
    data: { status: status as ApplicationStatus },
  });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "application.status_update",
    entityType: "JobApplication",
    entityId: parsedId.data,
    ip: await getClientIp(),
  });

  revalidatePath("/admin/applications");
  return true;
}

export async function updateApplicationNotes(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, message: "الطلب غير موجود" };
  }

  const parsed = notesSchema.safeParse({
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes"),
  });

  if (!parsed.success) {
    return { success: false, message: "حالة غير صالحة" };
  }

  // updateMany, not update: the row can now legitimately disappear between
  // this admin loading the detail page and submitting this form (another
  // admin's deleteApplication below) — update() would throw P2025 in that
  // case, surfacing as an unhandled 500 instead of a normal "not found".
  const updated = await prisma.jobApplication.updateMany({
    where: { id: parsedId.data },
    data: {
      status: parsed.data.status as ApplicationStatus,
      adminNotes: parsed.data.adminNotes || null,
    },
  });

  if (updated.count === 0) {
    return { success: false, message: "الطلب غير موجود" };
  }

  await logAdminAction({
    adminUserId: session.user.id,
    action: "application.notes_update",
    entityType: "JobApplication",
    entityId: parsedId.data,
    ip: await getClientIp(),
  });

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${parsedId.data}`);
  return { success: true };
}

export async function deleteApplication(id: string) {
  const session = await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return;

  const existing = await prisma.jobApplication.findUnique({
    where: { id: parsedId.data },
    select: { resumeUrl: true },
  });
  if (!existing) return;

  await prisma.jobApplication.deleteMany({ where: { id: parsedId.data } });

  try {
    await deleteResumeFile(existing.resumeUrl);
  } catch (error) {
    console.error("[application.delete] failed to delete resume file from storage", parsedId.data, error);
  }

  await logAdminAction({
    adminUserId: session.user.id,
    action: "application.delete",
    entityType: "JobApplication",
    entityId: parsedId.data,
    ip: await getClientIp(),
  });

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${parsedId.data}`);
}
