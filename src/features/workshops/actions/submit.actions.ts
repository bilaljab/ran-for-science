"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { logAbuseEvent } from "@/lib/abuse-log";
import { isKnownBadFingerprint } from "@/lib/fingerprint";
import { isTooFast } from "@/lib/timing-trap";
import { getWorkshopBySlug, responseBelongsToWorkshop } from "@/features/workshops/data/workshops.data";
import { getRegistrationState, SUBMIT_GRACE_MS } from "@/features/workshops/lib/registration-window";
import { workshopResponseSchema } from "@/features/workshops/validations/response.schema";
import { workshopCookieName } from "@/features/workshops/lib/cookie";
import { HONEYPOT_FIELD, OTHER_OPTION } from "@/features/workshops/constants/options";
import type { ActionState } from "@/lib/actions/types";

// More generous than the contact form: a whole cohort can sit behind one
// campus/office NAT and submit inside the same few minutes.
const SUBMIT_LIMIT = 20;
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;
const CERTIFICATE_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60;
const BLOCKED = { success: false, message: "تعذر إرسال النموذج. حدّث الصفحة (F5) ثم أعد المحاولة." } as const;

export async function submitWorkshopResponse(
  slug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  const fp = formData.get("fp");

  // Unlike the contact form (which fakes success to mislead bots), a blocked
  // submit here must be VISIBLE: a real student hit by a false positive
  // (browser autofill filling the honeypot, an automation-flagged browser)
  // would otherwise stare at a page that silently does nothing.
  if (formData.get(HONEYPOT_FIELD)) {
    logAbuseEvent({ type: "honeypot_triggered", ip, detail: "workshop" });
    return BLOCKED;
  }

  if (formData.get("fpBot") === "1") {
    logAbuseEvent({ type: "webdriver_detected", ip, detail: "workshop" });
    return BLOCKED;
  }

  if (isTooFast(formData.get("formRenderedAt"))) {
    logAbuseEvent({ type: "timing_trap_triggered", ip, detail: "workshop" });
    return BLOCKED;
  }

  if (await isKnownBadFingerprint(fp, "PUBLIC")) return BLOCKED;

  if (
    !(await checkRateLimit(`workshop:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS, {
      ip,
      source: "workshop",
      scope: "PUBLIC",
      fingerprint: typeof fp === "string" ? fp : undefined,
    }))
  ) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  if (!(await verifyCaptcha(formData.get("cf-turnstile-response"), ip))) {
    logAbuseEvent({ type: "captcha_failed", ip, detail: "workshop" });
    return { success: false, message: "تعذر التحقق من أنك لست روبوتاً، الرجاء المحاولة مرة أخرى." };
  }

  const workshop = await getWorkshopBySlug(slug);
  // The attendance check: the window is enforced HERE, on the server clock,
  // never trusted from the page the student happens to have open.
  if (!workshop || getRegistrationState(workshop, new Date(), SUBMIT_GRACE_MS) !== "open") {
    return { success: false, message: "انتهى وقت التسجيل لهذه الورشة." };
  }

  const cookieStore = await cookies();
  const cookieName = workshopCookieName(workshop.id);
  const previousId = cookieStore.get(cookieName)?.value;
  if (previousId && (await responseBelongsToWorkshop(workshop.id, previousId))) {
    redirect(`/w/${workshop.slug}/done/${previousId}`);
  }

  const parsed = workshopResponseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const response = await prisma.workshopResponse.create({
    data: {
      workshopId: workshop.id,
      ...parsed.data,
      educationOther: parsed.data.education === OTHER_OPTION ? parsed.data.educationOther || null : null,
      currentStatusOther: parsed.data.currentStatus === OTHER_OPTION ? parsed.data.currentStatusOther || null : null,
      benefitOther: parsed.data.benefit === OTHER_OPTION ? parsed.data.benefitOther || null : null,
      jobTitle: parsed.data.jobTitle || null,
      yearsExperience: parsed.data.yearsExperience || null,
    },
    select: { id: true },
  });

  cookieStore.set(cookieName, response.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/w",
    maxAge: CERTIFICATE_COOKIE_MAX_AGE_S,
  });

  redirect(`/w/${workshop.slug}/done/${response.id}`);
}
