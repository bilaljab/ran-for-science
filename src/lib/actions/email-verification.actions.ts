"use server";

import { prisma } from "@/lib/prisma";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ActionState } from "@/lib/actions/types";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Same rationale as password-reset confirmation: the token itself is
// unguessable (256-bit random), this just caps repeated-attempt cost.
const VERIFY_CONFIRM_LIMIT = 10;
const VERIFY_CONFIRM_WINDOW_MS = 15 * 60 * 1000;

/**
 * Not wired to any current UI (there's no self-registration flow — admin
 * accounts are only created via the seed script, which auto-verifies them).
 * This exists so a future "invite a new admin" feature has a ready-made,
 * fully working verification mechanism to call instead of building one from
 * scratch.
 */
export async function sendVerificationEmail(adminUserId: string): Promise<void> {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!admin) return;

  const rawToken = generateRawToken();
  await prisma.emailVerificationToken.create({
    data: {
      tokenHash: hashToken(rawToken),
      adminUserId: admin.id,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/admin/verify-email?token=${rawToken}`;
  await sendEmail({
    to: admin.email,
    subject: "تأكيد البريد الإلكتروني - RAN For Science",
    html: `<p>اضغط على الرابط التالي لتأكيد بريدك الإلكتروني (صالح لمدة 24 ساعة):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

export async function verifyEmail(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  if (
    !checkRateLimit(`verify-confirm:${ip}`, VERIFY_CONFIRM_LIMIT, VERIFY_CONFIRM_WINDOW_MS, {
      ip,
      source: "verify-confirm",
      scope: "ADMIN",
    })
  ) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    return { success: false, message: "رابط التأكيد غير صالح." };
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  // Atomic claim (see password-reset.actions.ts for the full rationale) —
  // an `updateMany` conditioned on `usedAt: null` can only match for one of
  // two concurrent requests holding the same token.
  const claimed = await prisma.emailVerificationToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });

  if (claimed.count === 0) {
    return { success: false, message: "رابط التأكيد غير صالح أو منتهي الصلاحية." };
  }

  const verificationToken = await prisma.emailVerificationToken.findUniqueOrThrow({ where: { tokenHash } });

  await prisma.adminUser.update({
    where: { id: verificationToken.adminUserId },
    data: { emailVerified: now },
  });

  return { success: true, message: "تم تأكيد بريدك الإلكتروني بنجاح. يمكنك تسجيل الدخول الآن." };
}
