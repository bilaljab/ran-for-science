"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { QuoteStatus } from "@/generated/prisma/enums";

// Same shared `admin-mutate:` key/limit used across every admin mutation —
// see jobs/actions/admin.actions.ts's comment for why it's shared, not per-feature.
const ADMIN_MUTATE_LIMIT = 100;
const ADMIN_MUTATE_WINDOW_MS = 5 * 60 * 1000;

export async function updateQuoteStatus(id: string, status: string): Promise<boolean> {
  const session = await requireAdmin();

  const ip = await getClientIp();
  if (
    !(await checkRateLimit(`admin-mutate:${session.user.id}`, ADMIN_MUTATE_LIMIT, ADMIN_MUTATE_WINDOW_MS, {
      ip,
      source: "admin-quote-status-update",
      scope: "ADMIN",
    }))
  ) {
    return false;
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success || !Object.values(QuoteStatus).includes(status as QuoteStatus)) {
    return false;
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
    ip,
  });

  revalidatePath("/admin/quotes");
  return true;
}

export async function deleteQuote(id: string) {
  const session = await requireAdmin();

  const ip = await getClientIp();
  if (
    !(await checkRateLimit(`admin-mutate:${session.user.id}`, ADMIN_MUTATE_LIMIT, ADMIN_MUTATE_WINDOW_MS, {
      ip,
      source: "admin-quote-delete",
      scope: "ADMIN",
    }))
  ) {
    return;
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return;

  await prisma.serviceQuoteRequest.deleteMany({ where: { id: parsedId.data } });

  await logAdminAction({
    adminUserId: session.user.id,
    action: "quote.delete",
    entityType: "ServiceQuoteRequest",
    entityId: parsedId.data,
    ip,
  });

  revalidatePath("/admin/quotes");
}
