"use server";

import { prisma } from "@/lib/prisma";
import { buildResumeKey, getResumeUploadUrl } from "@/lib/storage";
import { presignResumeInputSchema } from "@/features/jobs/validations/application.schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAbuseEvent } from "@/lib/abuse-log";
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
 * On fpBot/timing-trap hits specifically, this still returns a REAL key +
 * presigned URL (fake success) rather than an honest rejection — matching
 * the same stealth convention already used by submitJobApplication and the
 * other public actions for these exact checks, so a bot can't tell
 * "detected" apart from "allowed" and iterate against the defense. (Unlike
 * those sibling actions, honeypot/fingerprint hits here get no special
 * handling at all beyond the rate limit below — see note further down.)
 *
 * Unlike those sibling actions, though, this endpoint's "fake success" isn't
 * a no-op: it hands out a real, valid presigned R2 PUT URL, which costs real
 * storage/bandwidth if used. So the rate limit is checked FIRST and applies
 * unconditionally — including on the bot-detected path — rather than being
 * skippable by tripping a cheaper check first. A detected bot that's still
 * within the rate limit gets a real key/URL (stealth preserved, worst case
 * one orphaned R2 object per allowed request); once the limit is hit, it
 * gets the same honest rejection as everyone else, matching how rate-limit
 * and CAPTCHA are already the two honest (non-stealth) checks elsewhere in
 * this codebase.
 *
 * Honeypot and fingerprint checks are deliberately NOT repeated here (unlike
 * submitJobApplication, which still checks both in full): since this
 * function's response is identical either way once the rate limit passes,
 * checking them here would only spend a DB round trip (fingerprint) on a
 * result nothing reads. submitJobApplication remains the real, unweakened
 * gate — it independently re-checks honeypot/fingerprint/CAPTCHA before ever
 * creating a DB row, so skipping the redundant check here doesn't loosen
 * anything a bot could actually exploit.
 */
export async function presignResumeUpload(rawInput: unknown): Promise<PresignResumeUploadResult> {
  const ip = await getClientIp();

  const parsed = presignResumeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: GENERIC_FAIL_MESSAGE };
  }
  const { jobId, formRenderedAt, fp, fpBot, mimeType } = parsed.data;

  const job = await prisma.jobPosting.findUnique({ where: { id: jobId }, select: { id: true, status: true } });
  if (!job || job.status !== "PUBLISHED") {
    return { success: false, message: GENERIC_FAIL_MESSAGE };
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

  if (fpBot === "1") {
    logAbuseEvent({ type: "webdriver_detected", ip, detail: "apply-presign" });
  } else if (isTooFast(formRenderedAt ?? null)) {
    logAbuseEvent({ type: "timing_trap_triggered", ip, detail: "apply-presign" });
  }

  const key = buildResumeKey(mimeType);
  const uploadUrl = await getResumeUploadUrl(key);
  return { success: true, key, uploadUrl };
}
