import { prisma } from "@/lib/prisma";

type AuditEntry = {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  ip: string;
};

/**
 * Durable "who did what, to which record, when" trail (AdminAuditLog table),
 * separate from the ephemeral console-based abuse/operational logging in
 * lib/abuse-log.ts. Failing to write an audit entry must never block the
 * actual admin action it's describing — the action already succeeded (or is
 * about to), so a logging failure here is logged and swallowed, not thrown.
 */
export async function logAdminAction({ adminUserId, action, entityType, entityId, ip }: AuditEntry): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: { adminUserId, action, entityType, entityId, ip },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log entry", { action, entityType, entityId }, error);
  }
}
