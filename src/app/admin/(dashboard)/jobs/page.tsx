import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { getAdminJobs } from "@/features/jobs/data/jobs.data";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteJobButton } from "@/features/jobs/components/DeleteJobButton";
import { jobStatusLabels, jobStatusTones } from "@/features/jobs/constants/status-labels";

export default async function AdminJobsPage() {
  const jobs = await getAdminJobs();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-800">الوظائف</h1>
        <Link
          href="/admin/jobs/new"
          className="flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          وظيفة جديدة
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-primary-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary-50/60 text-start text-xs font-semibold text-primary-700">
            <tr>
              <th className="px-4 py-3 text-start">المسمى الوظيفي</th>
              <th className="px-4 py-3 text-start">المجال</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-4 py-3 text-start">الطلبات</th>
              <th className="px-4 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t border-primary-50">
                <td className="px-4 py-3 font-medium text-primary-900">{job.titleAr}</td>
                <td className="px-4 py-3 text-primary-900/70">{job.field ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={jobStatusLabels[job.status]} tone={jobStatusTones[job.status]} />
                </td>
                <td className="px-4 py-3 text-primary-900/70">{job._count.applications}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/jobs/${job.id}/edit`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-primary-600 hover:bg-primary-50"
                      aria-label="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteJobButton id={job.id} />
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-primary-900/50">
                  لا توجد وظائف بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
