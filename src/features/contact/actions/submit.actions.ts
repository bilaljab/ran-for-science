"use server";

import { prisma } from "@/lib/prisma";
import { contactMessageSchema } from "@/features/contact/validations/contact.schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { logAbuseEvent } from "@/lib/abuse-log";
import { isKnownBadFingerprint } from "@/lib/fingerprint";
import { isTooFast } from "@/lib/timing-trap";
import type { ActionState } from "@/lib/actions/types";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;

export async function submitContactMessage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  const fp = formData.get("fp");

  if (formData.get("website")) {
    return { success: true };
  }

  if (formData.get("fpBot") === "1") {
    logAbuseEvent({ type: "webdriver_detected", ip, detail: "contact" });
    return { success: true };
  }

  if (isTooFast(formData.get("formRenderedAt"))) {
    logAbuseEvent({ type: "timing_trap_triggered", ip, detail: "contact" });
    return { success: true };
  }

  if (await isKnownBadFingerprint(fp, "PUBLIC")) {
    return { success: true };
  }

  if (!checkRateLimit(`contact:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS, { ip, source: "contact", scope: "PUBLIC", fingerprint: typeof fp === "string" ? fp : undefined })) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  if (!(await verifyCaptcha(formData.get("cf-turnstile-response"), ip))) {
    logAbuseEvent({ type: "captcha_failed", ip, detail: "contact" });
    return { success: false, message: "تعذر التحقق من أنك لست روبوتاً، الرجاء المحاولة مرة أخرى." };
  }

  const parsed = contactMessageSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, phone, subject, message } = parsed.data;

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
    },
  });

  return { success: true };
}
