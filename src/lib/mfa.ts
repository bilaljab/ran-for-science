import { generateSecret, verify, generateURI } from "otplib";

/**
 * TOTP (RFC 6238) helpers, ready to wire into the login flow. Not yet enforced
 * for any account (AdminUser.twoFactorEnabled defaults to false) — enabling it
 * for a user is just a matter of generating+storing a secret and flipping the
 * flag; the verification step in auth.ts already checks it when set.
 */

export function generateTwoFactorSecret(): string {
  return generateSecret();
}

export function getTwoFactorEnrollmentUri(email: string, secret: string): string {
  return generateURI({ issuer: "RAN For Science", label: email, secret });
}

export async function verifyTwoFactorCode(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const result = await verify({ secret, token: code });
  return result.valid;
}
