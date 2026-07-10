import { NextResponse } from "next/server";
import { getValidAdminSession } from "@/lib/require-admin";
import { getJobApplicationResume } from "@/features/jobs/data/jobs.data";
import { readResumeFile } from "@/lib/storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { idSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit-log";

// Authenticated-only, so the threat here isn't brute force — it's a
// compromised/malicious session hammering downloads to run up storage
// egress costs (R2) or exhaust disk I/O. Generous limit, keyed by account.
const DOWNLOAD_LIMIT = 60;
const DOWNLOAD_WINDOW_MS = 5 * 60 * 1000;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // getValidAdminSession() (not the raw auth()) so a session revoked by a
  // password change (e.g. after a suspected compromise) can't keep pulling
  // applicant PII here until its JWT naturally expires — this is the one
  // place that guarantee was previously missing.
  const session = await getValidAdminSession();
  const ip = await getClientIp();
  if (!session?.user) {
    console.warn(`[auth] unauthorized resume download attempt from ip=${ip}`);
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (
    !checkRateLimit(`download:${session.user.id}`, DOWNLOAD_LIMIT, DOWNLOAD_WINDOW_MS, {
      ip,
      source: "resume-download",
      scope: "ADMIN",
    })
  ) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return new NextResponse("Not found", { status: 404 });
  }
  const application = await getJobApplicationResume(parsedId.data);
  if (!application) {
    return new NextResponse("Not found", { status: 404 });
  }

  // The application row can be deleted (by another admin, via
  // deleteApplication) between the lookup above and this read — treat a
  // missing storage object the same as a missing row, not an unhandled 500.
  let buffer: Buffer;
  try {
    buffer = await readResumeFile(application.resumeUrl);
  } catch (error) {
    console.error(`[admin] resume file missing for application ${parsedId.data}`, error);
    return new NextResponse("Not found", { status: 404 });
  }

  await logAdminAction({
    adminUserId: session.user.id,
    action: "application.resume_download",
    entityType: "JobApplication",
    entityId: parsedId.data,
    ip,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(application.resumeFileName)}"`,
    },
  });
}
