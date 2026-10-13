import { NextResponse } from "next/server";
import { getValidAdminSession, requireAdmin } from "@/lib/require-admin";
import { getJobApplicationResume } from "@/features/jobs/data/jobs.data";
import { getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// ruleid: admin-route-must-check-session
export async function GET(_request: Request) {
  const rows = await prisma.jobApplication.findMany();
  return NextResponse.json(rows);
}

// ruleid: admin-route-must-check-session
export async function POST(_request: Request) {
  const application = await getJobApplicationResume("x");
  const session = await getValidAdminSession();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json(application);
}

// ruleid: admin-route-must-check-session
export async function DELETE(_request: Request) {
  const ip = await getClientIp();
  await prisma.jobApplication.deleteMany({ where: { id: ip } });
  return new NextResponse(null, { status: 204 });
}

// ruleid: admin-route-must-check-session
export async function PUT(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (id) {
    await requireAdmin();
  }
  return NextResponse.json({ id });
}

// ok: admin-route-must-check-session
export async function PATCH(_request: Request) {
  const session = await getValidAdminSession();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json(await prisma.jobApplication.findMany());
}

// ok: admin-route-must-check-session
export async function HEAD(_request: Request) {
  await requireAdmin();
  return new NextResponse(null);
}

// ok: admin-route-must-check-session
export async function OPTIONS(_request: Request) {
  const session = await requireAdmin();
  return NextResponse.json({ by: session.user.id });
}

// A non-HTTP-method helper in a route file is not a handler.
// ok: admin-route-must-check-session
export async function helperNotAHandler() {
  return prisma.jobApplication.findMany();
}
