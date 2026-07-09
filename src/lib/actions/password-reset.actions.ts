"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ActionState } from "@/lib/actions/types";

const RESET_REQUEST_LIMIT = 3;
const RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Tokens are 256-bit random values, so brute-forcing one is infeasible
// regardless of rate limiting — this limit exists to cap the CPU cost of
// repeated hash/DB lookups (resource exhaustion), not to stop guessing.
const RESET_CONFIRM_LIMIT = 10;
const RESET_CONFIRM_WINDOW_MS = 15 * 60 * 1000;

const requestSchema = z.object({ email: z.string().trim().email() });
const resetSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(12, "Password must be at least 12 characters long."),
});

const GENERIC_MESSAGE = "إذا كان البريد الإلكتروني مسجلاً لدينا، سنرسل رابط إعادة تعيين كلمة المرور إليه.";

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  if (
    !checkRateLimit(`reset-request:${ip}`, RESET_REQUEST_LIMIT, RESET_REQUEST_WINDOW_MS, {
      ip,
      source: "reset-request",
      scope: "ADMIN",
    })
  ) {
    // Same generic message on rate-limit as on success — don't leak state to a prober.
    return { success: true, message: GENERIC_MESSAGE };
  }

  const parsed = requestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });

  // Always behave identically whether or not the account exists, to prevent
  // using this endpoint to enumerate valid admin emails.
  if (admin) {
    const rawToken = generateRawToken();
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        adminUserId: admin.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/admin/reset-password?token=${rawToken}`;
    await sendEmail({
      to: admin.email,
      subject: "إعادة تعيين كلمة المرور - RAN For Science",
      html: `<p>اضغط على الرابط التالي لإعادة تعيين كلمة المرور (صالح لمدة ساعة واحدة):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  return { success: true, message: GENERIC_MESSAGE };
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  if (
    !checkRateLimit(`reset-confirm:${ip}`, RESET_CONFIRM_LIMIT, RESET_CONFIRM_WINDOW_MS, {
      ip,
      source: "reset-confirm",
      scope: "ADMIN",
    })
  ) {
    return { success: false, message: "محاولات كثيرة جداً، الرجاء المحاولة لاحقاً." };
  }

  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const tokenHash = hashToken(parsed.data.token);
  const now = new Date();

  // Claim the token atomically BEFORE the slow bcrypt hash below (~100-300ms).
  // Checking `usedAt === null` in application code and only writing it later
  // (the original approach) leaves a race window: two concurrent requests
  // holding the same raw token could both pass that check before either
  // commits, defeating the single-use guarantee. An `updateMany` conditioned
  // on `usedAt: null` can only ever match — and thus "win" — for one of them,
  // since Postgres serializes concurrent writes to the same row.
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });

  if (claimed.count === 0) {
    return { success: false, message: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية." };
  }

  const resetToken = await prisma.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } });
  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: resetToken.adminUserId },
      data: { passwordHash, passwordChangedAt: now },
    }),
    // Invalidate any other outstanding reset tokens for this account.
    prisma.passwordResetToken.updateMany({
      where: { adminUserId: resetToken.adminUserId, usedAt: null, id: { not: resetToken.id } },
      data: { usedAt: now },
    }),
  ]);

  return { success: true, message: "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن." };
}
