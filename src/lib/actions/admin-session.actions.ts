"use server";

import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { getClientIp } from "@/lib/rate-limit";

/**
 * Self-service "log out of all other devices/sessions" — bumps sessionVersion
 * so every previously-issued JWT (including the one used to call this
 * action) fails isSessionStale() on its next check, without requiring a
 * password change. `{ increment: 1 }` is atomic at the DB level, avoiding a
 * lost-update race if double-submitted. Ends with signOut() so the browser
 * is redirected to the login page immediately, rather than leaving the
 * calling tab in a state where it would only discover it's logged out on
 * its next navigation.
 */
export async function revokeAllSessions(): Promise<void> {
  const session = await requireAdmin();
  const ip = await getClientIp();

  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: { sessionVersion: { increment: 1 } },
  });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "admin.revoke_all_sessions",
    entityType: "AdminUser",
    entityId: session.user.id,
    ip,
  });

  await signOut({ redirectTo: "/admin/login" });
}
