import { requireAdminPage } from "@/lib/require-admin";
import { getJobs } from "@/features/jobs/data/jobs.data";
import { prisma } from "@/lib/prisma";

// ruleid: admin-page-must-require-admin
export default async function MissingGuardPage() {
  const jobs = await getJobs();
  return <div>{jobs.length}</div>;
}

// ruleid: admin-page-must-require-admin
export default async function DataBeforeGuardPage() {
  const jobs = await getJobs();
  await requireAdminPage();
  return <div>{jobs.length}</div>;
}

// ruleid: admin-page-must-require-admin
export default async function ParamsBeforeGuardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage();
  return <div>{id}</div>;
}

// ruleid: admin-page-must-require-admin
export default async function PrismaDirectPage() {
  const rows = await prisma.jobPosting.findMany();
  return <div>{rows.length}</div>;
}

// ruleid: admin-page-must-require-admin
export default async function GuardInsideConditionPage({ cond }: { cond: boolean }) {
  if (cond) {
    await requireAdminPage();
  }
  return <div />;
}

// ruleid: admin-page-must-require-admin
export default function SyncPage() {
  return <div />;
}

// ok: admin-page-must-require-admin
export default async function GuardedPage() {
  await requireAdminPage();
  const jobs = await getJobs();
  return <div>{jobs.length}</div>;
}

// ok: admin-page-must-require-admin
export default async function GuardedWithParamsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  return <div>{id}</div>;
}

// ok: admin-page-must-require-admin
export default async function GuardedKeepingSessionPage() {
  const session = await requireAdminPage();
  return <div>{session.user.id}</div>;
}
