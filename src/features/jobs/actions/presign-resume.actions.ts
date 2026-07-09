"use server";

import { prisma } from "@/lib/prisma";
import { buildResumeKey, getResumeUploadUrl } from "@/lib/storage";
import { presignResumeInputSchema } from "@/features/jobs/validations/application.schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAbuseEvent } from "@/lib/abuse-log";
import { isKnownBadFingerprint } from "@/lib/fingerprint";
import { isTooFast } from "@/lib/timing-trap";

const PRESIGN_LIMIT = 10;
const PRESIGN_WINDOW_MS = 10 * 60 * 1000;
const GENERIC_FAIL_MESSAGE = "تعذر تجهيز رفع الملف، الرجاء المحاولة مرة أخرى.";

export type PresignResumeUploadResult =
  | { success: true; key: string; uploadUrl: string }
  | { success: false; message: string };

/**
 * Called directly from the client before the real form submission, purely to
 * obtain an R2 upload target — see ApplyForm.tsx. Runs the same cheap
 * gauntlet as submitJobApplication (honeypot/fpBot/timing/fingerprint/rate
 * limit) but deliberately skips CAPTCHA: one Turnstile solve per form is the
 * UX goal, and the real, CAPTCHA-gated decision is still submitJobApplication
 * creating the DB row.
 *
 * On honeypot/fpBot/timing-trap/fingerprint hits specifically, this returns
 * a REAL key + presigned URL (fake success) rather than an honest rejection
 * — matching the same stealth convention already used by submitJobApplication
 * and the other public actions for these exact checks, so a bot can't tell
 * "detected" apart from "allowed" and iterate against the defense. Worst
 * case, a detected bot PUTs a file straight to R2 (an orphaned object, no DB
 * row — bounded by the short presigned URL expiry and the rate limit below).
 * Rate-limit hits get an honest rejection, matching how rate-limiting and
 * CAPTCHA are the two already-honest checks elsewhere in this codebase.
 */
export async function presignResumeUpload(rawInput: unknown): Promise<PresignResumeUploadResult> {
  const ip = await getClientIp();

  const parsed = presignResumeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: GENERIC_FAIL_MESSAGE };
  }
  const { jobId, website, formRenderedAt, fp, fpBot, mimeType } = parsed.data;

  const job = await prisma.jobPosting.findUnique({ where: { id: jobId }, select: { id: true, status: true } });
  if (!job || job.status !== "PUBLISHED") {
    return { success: false, message: GENERIC_FAIL_MESSAGE };
  }

  const isHoneypotTripped = Boolean(website);
  const isWebdriver = fpBot === "1";
  const isTimingTrapTripped = isTooFast(formRenderedAt ?? null);
  const isBadFingerprint = await isKnownBadFingerprint(fp, "PUBLIC");

  if (isHoneypotTripped || isWebdriver || isTimingTrapTripped || isBadFingerprint) {
    if (isWebdriver) logAbuseEvent({ type: "webdriver_detected", ip, detail: "apply-presign" });
    else if (isTimingTrapTripped) logAbuseEvent({ type: "timing_trap_triggered", ip, detail: "apply-presign" });

    const key = buildResumeKey(mimeType);
    const uploadUrl = await getResumeUploadUrl(key);
    return { success: true, key, uploadUrl };
  }

  if (
    !checkRateLimit(`presign:${ip}`, PRESIGN_LIMIT, PRESIGN_WINDOW_MS, {
      ip,
      source: "apply-presign",
      scope: "PUBLIC",
      fingerprint: fp || undefined,
    })
  ) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  const key = buildResumeKey(mimeType);
  const uploadUrl = await getResumeUploadUrl(key);
  return { success: true, key, uploadUrl };
}
