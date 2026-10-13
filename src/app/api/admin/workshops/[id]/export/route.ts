import { NextResponse } from "next/server";
import { getValidAdminSession } from "@/lib/require-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { attachmentDisposition } from "@/lib/content-disposition";
import { getResponses, getWorkshopForAdmin } from "@/features/workshops/data/workshops.data";
import { toCsv } from "@/features/workshops/lib/csv";

const EXPORT_LIMIT = 30;
const EXPORT_WINDOW_MS = 5 * 60 * 1000;

const HEADERS = [
  "الاسم", "الجنسية", "المؤهل التعليمي", "المؤهل (أخرى)", "التخصص", "الصفة الحالية", "الصفة (أخرى)",
  "المسمى الوظيفي", "سنوات الخبرة", "جهة العمل / الدراسة", "تقييم الورشة", "تقييم المقدم",
  "تحقق الفائدة", "الفائدة (أخرى)", "ينصح بحضور ورش RAN", "الموضوع المقترح", "الملاحظات", "وقت التعبئة",
];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getValidAdminSession();
  const ip = await getClientIp();
  if (!session?.user) {
    logger.warn({ ip }, "auth_unauthorized_workshop_export_attempt");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (
    !(await checkRateLimit(`workshop-export:${session.user.id}`, EXPORT_LIMIT, EXPORT_WINDOW_MS, {
      ip,
      source: "workshop-export",
      scope: "ADMIN",
    }))
  ) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) return new NextResponse("Not found", { status: 404 });
  const workshop = await getWorkshopForAdmin(parsedId.data);
  if (!workshop) return new NextResponse("Not found", { status: 404 });

  const responses = await getResponses(workshop.id);
  const csv = toCsv(
    HEADERS,
    responses.map((r) => [
      r.fullName, r.nationality, r.education, r.educationOther, r.specialization, r.currentStatus, r.currentStatusOther,
      r.jobTitle, r.yearsExperience, r.organization, r.workshopRating, r.presenterRating,
      r.benefit, r.benefitOther, r.recommend, r.desiredTopic, r.notes, r.createdAt.toISOString(),
    ])
  );

  await logAdminAction({
    adminUserId: session.user.id,
    action: "workshop.export",
    entityType: "Workshop",
    entityId: workshop.id,
    ip,
  });

  // UTF-8 BOM so Excel opens the Arabic text correctly.
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": attachmentDisposition(`${workshop.slug}-responses.csv`),
    },
  });
}
