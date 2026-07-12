import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * A JWT session strategy never re-checks the DB by default, so a stolen/old
 * token would otherwise stay valid even after the password changes or an
 * admin explicitly revokes all sessions. Compares BOTH the passwordChangedAt
 * and sessionVersion embedded at sign-in time against the current DB values
 * — either one drifting rejects the session. passwordChangedAt updates as a
 * side effect of password changes; sessionVersion is the fast, explicit
 * "log out everywhere" primitive (see lib/actions/admin-session.actions.ts's
 * revokeAllSessions()) that doesn't require picking a new password.
 */
async function isSessionStale(
  userId: string,
  tokenPasswordChangedAt: number | undefined,
  tokenSessionVersion: number | undefined
): Promise<boolean> {
  if (typeof tokenPasswordChangedAt !== "number" || typeof tokenSessionVersion !== "number") return true;

  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { passwordChangedAt: true, sessionVersion: true },
  });

  if (!admin) return true;
  return (
    admin.passwordChangedAt.getTime() !== tokenPasswordChangedAt || admin.sessionVersion !== tokenSessionVersion
  );
}

/**
 * Non-throwing variant for use in page/layout Server Components, where a
 * clean redirect is preferable to an error boundary. Returns the session if
 * it's valid and fresh, or null otherwise.
 */
export async function getValidAdminSession() {
  const session = await auth();
  if (!session?.user) return null;
  if (await isSessionStale(session.user.id, session.user.passwordChangedAt, session.user.sessionVersion)) {
    const ip = await getClientIp();
    logger.warn({ ip }, "auth_stale_session_rejected");
    return null;
  }
  return session;
}

/** Re-checked inside every admin Server Action / route handler — never rely on middleware alone. */
export async function requireAdmin() {
  const session = await getValidAdminSession();
  if (!session) {
    const ip = await getClientIp();
    logger.warn({ ip }, "auth_unauthorized_admin_attempt");
    throw new Error("Unauthorized");
  }
  return session;
}
