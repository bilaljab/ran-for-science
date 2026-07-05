"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";
import { getClientIp } from "@/lib/rate-limit";
import { QuoteStatus } from "@/generated/prisma/enums";

export async function updateQuoteStatus(id: string, status: string) {
  const session = await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success || !Object.values(QuoteStatus).includes(status as QuoteStatus)) {
    return;
  }

  await prisma.serviceQuoteRequest.updateMany({
    where: { id: parsedId.data },
    data: { status: status as QuoteStatus },
  });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "quote.status_update",
    entityType: "ServiceQuoteRequest",
    entityId: parsedId.data,
    ip: await getClientIp(),
  });

  revalidatePath("/admin/quotes");
}
