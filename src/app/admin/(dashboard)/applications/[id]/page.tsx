import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { getJobApplicationDetail } from "@/features/jobs/data/jobs.data";
import { Card } from "@/components/ui/Card";
import { ApplicationDetailForm } from "@/features/jobs/components/ApplicationDetailForm";
import { idSchema } from "@/lib/validation";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  const application = await getJobApplicationDetail(parsedId.data);
  if (!application) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-primary-800">{application.fullName}</h1>
      <p className="mt-1 text-sm text-primary-900/60">تقدّم لوظيفة: {application.job.titleAr}</p>

      <Card className="mt-6">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-primary-900/50">البريد الإلكتروني</dt>
            <dd className="mt-1 font-medium text-primary-900" dir="ltr">
              {application.email}
            </dd>
          </div>
          <div>
            <dt className="text-primary-900/50">رقم الهاتف</dt>
            <dd className="mt-1 font-medium text-primary-900" dir="ltr">
              {application.phone}
            </dd>
          </div>
          <div>
            <dt className="text-primary-900/50">تاريخ التقديم</dt>
            <dd className="mt-1 font-medium text-primary-900">
              {application.createdAt.toLocaleString("ar-SA")}
            </dd>
          </div>
          <div>
            <dt className="text-primary-900/50">السيرة الذاتية</dt>
            <dd className="mt-1">
              <a
                href={`/api/admin/uploads/applications/${application.id}`}
                className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700"
              >
                <Download className="h-4 w-4" />
                {application.resumeFileName}
              </a>
            </dd>
          </div>
        </dl>

        {application.coverNote && (
          <div className="mt-6 border-t border-primary-50 pt-6">
            <dt className="text-sm text-primary-900/50">رسالة تعريفية</dt>
            <dd className="mt-2 whitespace-pre-line text-sm text-primary-900/80">{application.coverNote}</dd>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <ApplicationDetailForm
          id={application.id}
          status={application.status}
          adminNotes={application.adminNotes}
        />
      </Card>
    </div>
  );
}
