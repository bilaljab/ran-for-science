"use server";

import { prisma } from "@/lib/prisma";
import { saveResumeFile, InvalidFileContentError } from "@/lib/storage";
import { jobApplicationSchema, resumeFileSchema } from "@/features/jobs/validations/application.schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { logAbuseEvent } from "@/lib/abuse-log";
import { isKnownBadFingerprint } from "@/lib/fingerprint";
import { isTooFast } from "@/lib/timing-trap";
import type { ActionState } from "@/lib/actions/types";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;

export async function submitJobApplication(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  const fp = formData.get("fp");

  if (formData.get("website")) {
    return { success: true };
  }

  if (formData.get("fpBot") === "1") {
    logAbuseEvent({ type: "webdriver_detected", ip, detail: "apply" });
    return { success: true };
  }

  if (isTooFast(formData.get("formRenderedAt"))) {
    logAbuseEvent({ type: "timing_trap_triggered", ip, detail: "apply" });
    return { success: true };
  }

  if (await isKnownBadFingerprint(fp)) {
    return { success: true };
  }

  if (!checkRateLimit(`apply:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS, { ip, source: "apply", fingerprint: typeof fp === "string" ? fp : undefined })) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  if (!(await verifyCaptcha(formData.get("cf-turnstile-response"), ip))) {
    logAbuseEvent({ type: "captcha_failed", ip, detail: "apply" });
    return { success: false, message: "تعذر التحقق من أنك لست روبوتاً، الرجاء المحاولة مرة أخرى." };
  }

  const parsed = jobApplicationSchema.safeParse({
    jobId: formData.get("jobId"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    coverNote: formData.get("coverNote"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const resumeResult = resumeFileSchema.safeParse(formData.get("resume"));
  if (!resumeResult.success) {
    return { success: false, errors: { resume: [resumeResult.error.issues[0]?.message ?? "Invalid file"] } };
  }

  const job = await prisma.jobPosting.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.status !== "PUBLISHED") {
    return { success: false, message: "Job not found" };
  }

  let key: string;
  let fileName: string;
  try {
    ({ key, fileName } = await saveResumeFile(resumeResult.data));
  } catch (error) {
    if (error instanceof InvalidFileContentError) {
      return { success: false, errors: { resume: ["Only real PDF or Word documents are accepted."] } };
    }
    throw error;
  }

  await prisma.jobApplication.create({
    data: {
      jobId: job.id,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      coverNote: parsed.data.coverNote || null,
      resumeUrl: key,
      resumeFileName: fileName,
    },
  });

  return { success: true };
}
