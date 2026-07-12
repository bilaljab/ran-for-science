"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { jobPostingSchema } from "@/features/jobs/validations/job.schema";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ActionState } from "@/lib/actions/types";
import type { JobStatus, JobType } from "@/generated/prisma/enums";

// Defense-in-depth against a compromised admin session or a runaway script —
// not a normal-usage throttle. Deliberately the SAME key prefix
// (`admin-mutate:`) used across every admin mutation (jobs, applications,
// quotes, messages), not a separate limit per feature — a per-feature limit
// would let an attacker rack up the full limit in each area independently,
// the same class of bypass this session's rate-limit rework was fixing for
// the public forms.
const ADMIN_MUTATE_LIMIT = 100;
const ADMIN_MUTATE_WINDOW_MS = 5 * 60 * 1000;

function parseJobForm(formData: FormData) {
  return jobPostingSchema.safeParse({
    slug: formData.get("slug"),
    titleAr: formData.get("titleAr"),
    titleEn: formData.get("titleEn"),
    descriptionAr: formData.get("descriptionAr"),
    descriptionEn: formData.get("descriptionEn"),
    requirementsAr: formData.get("requirementsAr"),
    requirementsEn: formData.get("requirementsEn"),
    field: formData.get("field"),
    location: formData.get("location"),
    jobType: formData.get("jobType"),
    status: formData.get("status"),
  });
}

export async function createJob(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();

  const ip = await getClientIp();
  if (
    !(await checkRateLimit(`admin-mutate:${session.user.id}`, ADMIN_MUTATE_LIMIT, ADMIN_MUTATE_WINDOW_MS, {
      ip,
      source: "admin-job-create",
      scope: "ADMIN",
    }))
  ) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { requirementsAr, requirementsEn, field, location, status, jobType, ...rest } = parsed.data;

  const job = await prisma.jobPosting.create({
    data: {
      ...rest,
      status: status as JobStatus,
      jobType: jobType as JobType,
      requirementsAr: requirementsAr || null,
      requirementsEn: requirementsEn || null,
      field: field || null,
      location: location || null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "job.create",
    entityType: "JobPosting",
    entityId: job.id,
    ip,
  });

  revalidatePath("/admin/jobs");
  redirect("/admin/jobs");
}

export async function updateJob(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const ip = await getClientIp();
  if (
    !(await checkRateLimit(`admin-mutate:${session.user.id}`, ADMIN_MUTATE_LIMIT, ADMIN_MUTATE_WINDOW_MS, {
      ip,
      source: "admin-job-update",
      scope: "ADMIN",
    }))
  ) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, message: "Job not found" };
  }

  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.jobPosting.findUnique({ where: { id: parsedId.data } });
  if (!existing) {
    return { success: false, message: "Job not found" };
  }

  const { requirementsAr, requirementsEn, field, location, status, jobType, ...rest } = parsed.data;

  await prisma.jobPosting.update({
    where: { id: parsedId.data },
    data: {
      ...rest,
      status: status as JobStatus,
      jobType: jobType as JobType,
      requirementsAr: requirementsAr || null,
      requirementsEn: requirementsEn || null,
      field: field || null,
      location: location || null,
      publishedAt:
        status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "job.update",
    entityType: "JobPosting",
    entityId: parsedId.data,
    ip,
  });

  revalidatePath("/admin/jobs");
  redirect("/admin/jobs");
}

export async function deleteJob(id: string) {
  const session = await requireAdmin();

  const ip = await getClientIp();
  if (
    !(await checkRateLimit(`admin-mutate:${session.user.id}`, ADMIN_MUTATE_LIMIT, ADMIN_MUTATE_WINDOW_MS, {
      ip,
      source: "admin-job-delete",
      scope: "ADMIN",
    }))
  ) {
    return;
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return;

  await prisma.jobPosting.deleteMany({ where: { id: parsedId.data } });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "job.delete",
    entityType: "JobPosting",
    entityId: parsedId.data,
    ip,
  });

  revalidatePath("/admin/jobs");
}
