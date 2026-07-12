"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { MessageStatus } from "@/generated/prisma/enums";

// Same shared `admin-mutate:` key/limit used across every admin mutation —
// see jobs/actions/admin.actions.ts's comment for why it's shared, not per-feature.
const ADMIN_MUTATE_LIMIT = 100;
const ADMIN_MUTATE_WINDOW_MS = 5 * 60 * 1000;

export async function updateMessageStatus(id: string, status: string): Promise<boolean> {
  const session = await requireAdmin();

  const ip = await getClientIp();
  if (
    !(await checkRateLimit(`admin-mutate:${session.user.id}`, ADMIN_MUTATE_LIMIT, ADMIN_MUTATE_WINDOW_MS, {
      ip,
      source: "admin-message-status-update",
      scope: "ADMIN",
    }))
  ) {
    return false;
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success || !Object.values(MessageStatus).includes(status as MessageStatus)) {
    return false;
  }

  await prisma.contactMessage.updateMany({
    where: { id: parsedId.data },
    data: { status: status as MessageStatus },
  });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "message.status_update",
    entityType: "ContactMessage",
    entityId: parsedId.data,
    ip,
  });

  revalidatePath("/admin/messages");
  return true;
}

export async function deleteMessage(id: string) {
  const session = await requireAdmin();

  const ip = await getClientIp();
  if (
    !(await checkRateLimit(`admin-mutate:${session.user.id}`, ADMIN_MUTATE_LIMIT, ADMIN_MUTATE_WINDOW_MS, {
      ip,
      source: "admin-message-delete",
      scope: "ADMIN",
    }))
  ) {
    return;
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return;

  await prisma.contactMessage.deleteMany({ where: { id: parsedId.data } });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "message.delete",
    entityType: "ContactMessage",
    entityId: parsedId.data,
    ip,
  });

  revalidatePath("/admin/messages");
}
