"use server";

import { prisma } from "@/lib/prisma";
import { quoteRequestSchema } from "@/features/quotes/validations/quote.schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { logAbuseEvent } from "@/lib/abuse-log";
import { isKnownBadFingerprint } from "@/lib/fingerprint";
import { isTooFast } from "@/lib/timing-trap";
import type { ActionState } from "@/lib/actions/types";
import type { ServiceCategory } from "@/generated/prisma/enums";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;

export async function submitQuoteRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  const fp = formData.get("fp");

  // Honeypot: real users never fill this hidden field; bots usually do.
  if (formData.get("website")) {
    return { success: true };
  }

  if (formData.get("fpBot") === "1") {
    logAbuseEvent({ type: "webdriver_detected", ip, detail: "quote" });
    return { success: true };
  }

  if (isTooFast(formData.get("formRenderedAt"))) {
    logAbuseEvent({ type: "timing_trap_triggered", ip, detail: "quote" });
    return { success: true };
  }

  if (await isKnownBadFingerprint(fp)) {
    return { success: true };
  }

  if (!checkRateLimit(`quote:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS, { ip, source: "quote", fingerprint: typeof fp === "string" ? fp : undefined })) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  if (!(await verifyCaptcha(formData.get("cf-turnstile-response"), ip))) {
    logAbuseEvent({ type: "captcha_failed", ip, detail: "quote" });
    return { success: false, message: "تعذر التحقق من أنك لست روبوتاً، الرجاء المحاولة مرة أخرى." };
  }

  const parsed = quoteRequestSchema.safeParse({
    category: formData.get("category"),
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { companyName, ...rest } = parsed.data;

  await prisma.serviceQuoteRequest.create({
    data: {
      ...rest,
      category: rest.category as ServiceCategory,
      companyName: companyName || null,
    },
  });

  return { success: true };
}
