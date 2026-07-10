import Link from "next/link";
import { getJobApplications, getJobTitlesForFilter } from "@/features/jobs/data/jobs.data";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteApplication } from "@/features/jobs/actions/application-status.actions";
import {
  applicationStatusLabels,
  applicationStatusTones,
  applicationStatusValuesList,
} from "@/features/jobs/constants/status-labels";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; status?: string }>;
}) {
  const { jobId, status } = await searchParams;

  const [applications, jobs] = await Promise.all([
    getJobApplications({ jobId, status }),
    getJobTitlesForFilter(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">الطلبات والسير الذاتية</h1>

      <form className="mt-6 flex flex-wrap gap-4" method="get">
        <select
          name="jobId"
          defaultValue={jobId ?? ""}
          className="rounded-md border border-primary-200 bg-white px-3.5 py-2.5 text-sm"
        >
          <option value="">كل الوظائف</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.titleAr}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-primary-200 bg-white px-3.5 py-2.5 text-sm"
        >
          <option value="">كل الحالات</option>
          {applicationStatusValuesList.map((s) => (
            <option key={s} value={s}>
              {applicationStatusLabels[s]}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          تصفية
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-primary-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary-50/60 text-xs font-semibold text-primary-700">
            <tr>
              <th className="px-4 py-3 text-start">المتقدم</th>
              <th className="px-4 py-3 text-start">الوظيفة</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-4 py-3 text-start">تاريخ التقديم</th>
              <th className="px-4 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-t border-primary-50">
                <td className="px-4 py-3 font-medium text-primary-900">{app.fullName}</td>
                <td className="px-4 py-3 text-primary-900/70">{app.job.titleAr}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={applicationStatusLabels[app.status]}
                    tone={applicationStatusTones[app.status]}
                  />
                </td>
                <td className="px-4 py-3 text-primary-900/70">
                  {app.createdAt.toLocaleDateString("ar-SA")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      عرض
                    </Link>
                    <DeleteButton
                      action={deleteApplication.bind(null, app.id)}
                      confirmMessage="هل أنت متأكد من حذف هذا الطلب؟"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-primary-900/50">
                  لا توجد طلبات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
