"use server";

import { prisma } from "@/lib/prisma";
import { readResumeFile, detectResumeContentType, deleteResumeFile } from "@/lib/storage";
import { jobApplicationSchema, resumeRefSchema, MAX_RESUME_SIZE_BYTES } from "@/features/jobs/validations/application.schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { logAbuseEvent } from "@/lib/abuse-log";
import { isKnownBadFingerprint } from "@/lib/fingerprint";
import { isTooFast } from "@/lib/timing-trap";
import type { ActionState } from "@/lib/actions/types";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;
const INVALID_RESUME_MESSAGE = "Only real PDF or Word documents are accepted.";

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

  if (await isKnownBadFingerprint(fp, "PUBLIC")) {
    return { success: true };
  }

  if (!checkRateLimit(`apply:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS, { ip, source: "apply", scope: "PUBLIC", fingerprint: typeof fp === "string" ? fp : undefined })) {
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

  const resumeRefResult = resumeRefSchema.safeParse({
    key: formData.get("resumeKey"),
    fileName: formData.get("resumeFileName"),
  });
  if (!resumeRefResult.success) {
    return { success: false, errors: { resume: [INVALID_RESUME_MESSAGE] } };
  }

  const job = await prisma.jobPosting.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || job.status !== "PUBLISHED") {
    return { success: false, message: "Job not found" };
  }

  const { key, fileName } = resumeRefResult.data;

  // The browser already uploaded these bytes directly to R2 (see
  // presign-resume.actions.ts) to avoid Vercel's ~4.5MB inbound request-body
  // cap. Read them back here — an outbound call to R2, not subject to that
  // inbound cap — and verify the real content before trusting it, exactly as
  // the old saveResumeFile did before creating a DB row.
  let buffer: Buffer;
  try {
    buffer = await readResumeFile(key);
  } catch (error) {
    console.error("[apply] failed to read back uploaded resume", error);
    return { success: false, errors: { resume: [INVALID_RESUME_MESSAGE] } };
  }

  // The presign step only ever saw a client-declared fileSize (before any
  // bytes existed server-side) — a direct PUT to the presigned URL can send
  // whatever it wants regardless of what was declared. Re-check the actual
  // uploaded size here, the same way detectResumeContentType re-checks the
  // actual content, instead of trusting the earlier client-reported number.
  if (buffer.length === 0 || buffer.length > MAX_RESUME_SIZE_BYTES) {
    await deleteResumeFile(key).catch((error) => console.error("[apply] failed to delete oversized upload", error));
    return { success: false, errors: { resume: [INVALID_RESUME_MESSAGE] } };
  }

  const detectedMime = await detectResumeContentType(buffer);
  if (!detectedMime) {
    await deleteResumeFile(key).catch((error) => console.error("[apply] failed to delete invalid upload", error));
    return { success: false, errors: { resume: [INVALID_RESUME_MESSAGE] } };
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
