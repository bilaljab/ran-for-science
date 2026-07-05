"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";
import { getClientIp } from "@/lib/rate-limit";
import { MessageStatus } from "@/generated/prisma/enums";

export async function updateMessageStatus(id: string, status: string) {
  const session = await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success || !Object.values(MessageStatus).includes(status as MessageStatus)) {
    return;
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
    ip: await getClientIp(),
  });

  revalidatePath("/admin/messages");
}
