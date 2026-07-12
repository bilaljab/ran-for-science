"use server";

import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ActionState } from "@/lib/actions/types";

// Same rationale as password-reset confirmation: the token itself is
// unguessable (256-bit random), this just caps repeated-attempt cost.
const VERIFY_CONFIRM_LIMIT = 10;
const VERIFY_CONFIRM_WINDOW_MS = 15 * 60 * 1000;

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
