import { verify } from "otplib";

export async function verifyTwoFactorCode(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const result = await verify({ secret, token: code });
  return result.valid;
}
