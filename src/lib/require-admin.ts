import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

/**
 * A JWT session strategy never re-checks the DB by default, so a stolen/old
 * token would otherwise stay valid even after the password changes. This
 * compares the passwordChangedAt embedded at sign-in time against the current
 * DB value and rejects the session if they don't match.
 */
async function isSessionStale(userId: string, tokenPasswordChangedAt: number | undefined): Promise<boolean> {
  if (typeof tokenPasswordChangedAt !== "number") return true;

  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { passwordChangedAt: true },
  });

  if (!admin) return true;
  return admin.passwordChangedAt.getTime() !== tokenPasswordChangedAt;
}

/**
 * Non-throwing variant for use in page/layout Server Components, where a
 * clean redirect is preferable to an error boundary. Returns the session if
 * it's valid and fresh, or null otherwise.
 */
export async function getValidAdminSession() {
  const session = await auth();
  if (!session?.user) return null;
  if (await isSessionStale(session.user.id, session.user.passwordChangedAt)) {
    const ip = await getClientIp();
    console.warn(`[auth] rejected stale session (password changed since token issued) from ip=${ip}`);
    return null;
  }
  return session;
}

/** Re-checked inside every admin Server Action / route handler — never rely on middleware alone. */
export async function requireAdmin() {
  const session = await getValidAdminSession();
  if (!session) {
    const ip = await getClientIp();
    console.warn(`[auth] unauthorized admin action attempt from ip=${ip}`);
    throw new Error("Unauthorized");
  }
  return session;
}
