import { cache } from "react";
import { redirect } from "next/navigation";
import "server-only";
import { auth } from "@/auth";
import { ADMIN_SESSION_MAX_AGE_S } from "@/auth.config";
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
 *
 * Also enforces an ABSOLUTE lifetime: the JWT cookie is re-issued with a fresh
 * expiry on every read, so an actively used (or stolen and replayed) cookie
 * would otherwise never age out. `authTime` is stamped at sign-in only; tokens
 * minted before it existed are treated as stale (one forced re-login).
 */
async function isSessionStale(
  userId: string,
  tokenPasswordChangedAt: number | undefined,
  tokenSessionVersion: number | undefined,
  tokenAuthTime: number | undefined
): Promise<boolean> {
  if (typeof tokenPasswordChangedAt !== "number" || typeof tokenSessionVersion !== "number") return true;
  if (typeof tokenAuthTime !== "number" || Date.now() - tokenAuthTime > ADMIN_SESSION_MAX_AGE_S * 1000) return true;

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
 * it's valid and fresh, or null otherwise. cache() dedupes per RSC render and
 * is a pass-through in route handlers / Server Actions (no render scope).
 */
export const getValidAdminSession = cache(async () => {
  const session = await auth();
  if (!session?.user) return null;
  if (
    await isSessionStale(
      session.user.id,
      session.user.passwordChangedAt,
      session.user.sessionVersion,
      session.user.authTime
    )
  ) {
    const ip = await getClientIp();
    logger.warn({ ip }, "auth_stale_session_rejected");
    return null;
  }
  return session;
});

/**
 * First statement of EVERY admin page.tsx. The (dashboard) layout's check does
 * not protect page data: Next renders layout and page concurrently, so a page's
 * queries run (and get serialized into the response) even when the layout
 * redirects. cache() above makes layout + page share one auth()+DB check.
 */
export async function requireAdminPage() {
  const session = await getValidAdminSession();
  if (!session) redirect("/admin/login");
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
