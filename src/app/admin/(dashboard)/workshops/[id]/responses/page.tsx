import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { DistributionBars } from "@/features/workshops/components/DistributionBars";
import { getResponses, getWorkshopForAdmin, getWorkshopStats } from "@/features/workshops/data/workshops.data";
import { OTHER_OPTION } from "@/features/workshops/constants/options";
import { formatWorkshopDate } from "@/features/workshops/lib/format";
import { idSchema } from "@/lib/validation";

const rating = (value: number | null) => (value === null ? "—" : `${value.toFixed(1)} من 5`);
const withOther = (value: string, other: string | null) => (value === OTHER_OPTION && other ? `${value}: ${other}` : value);

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary-100 bg-white p-4">
      <p className="text-xs text-primary-900/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary-800">{value}</p>
    </div>
  );
}

export default async function WorkshopResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  const workshop = await getWorkshopForAdmin(parsedId.data);
  if (!workshop) notFound();

  const [stats, responses] = await Promise.all([getWorkshopStats(workshop.id), getResponses(workshop.id)]);
  const recommendPercent = stats.total === 0 ? "—" : `${Math.round((stats.recommendCount / stats.total) * 100)}%`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">{workshop.title}</h1>
          <p className="mt-1 text-sm text-primary-900/60">
            <span dir="ltr">{formatWorkshopDate(workshop.workshopDate)}</span> · {workshop.presenterName}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/workshops" className="rounded-md border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">
            رجوع
          </Link>
          <a
            href={`/api/admin/workshops/${workshop.id}/export`}
            className="flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Download aria-hidden className="h-4 w-4" />
            تصدير CSV
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="عدد الردود" value={String(stats.total)} />
        <StatCard label="متوسط تقييم الورشة" value={rating(stats.averageWorkshopRating)} />
        <StatCard label="متوسط تقييم المقدم" value={rating(stats.averagePresenterRating)} />
        <StatCard label="ينصحون بحضور ورش RAN" value={recommendPercent} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <DistributionBars title="المؤهل التعليمي" rows={stats.education} total={stats.total} />
        <DistributionBars title="الصفة الحالية" rows={stats.currentStatus} total={stats.total} />
        <DistributionBars title="هل حققت الورشة الفائدة؟" rows={stats.benefit} total={stats.total} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-primary-100 bg-white">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-primary-50/60 text-xs font-semibold text-primary-700">
            <tr>
              {["الاسم", "الجنسية", "المؤهل", "التخصص", "الصفة", "جهة العمل / الدراسة", "الورشة", "المقدم", "الفائدة", "ينصح؟", "الموضوع المقترح", "الملاحظات"].map((heading) => (
                <th key={heading} className="px-3 py-3 text-start">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className="border-t border-primary-50 align-top">
                <td className="px-3 py-3 font-medium text-primary-900">{r.fullName}</td>
                <td className="px-3 py-3 text-primary-900/70">{r.nationality}</td>
                <td className="px-3 py-3 text-primary-900/70">{withOther(r.education, r.educationOther)}</td>
                <td className="px-3 py-3 text-primary-900/70">{r.specialization}</td>
                <td className="px-3 py-3 text-primary-900/70">
                  {withOther(r.currentStatus, r.currentStatusOther)}
                  {(r.jobTitle || r.yearsExperience) && (
                    <span className="block text-xs text-primary-900/50">
                      {[r.jobTitle, r.yearsExperience && `${r.yearsExperience} سنة`].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-primary-900/70">{r.organization}</td>
                <td className="whitespace-nowrap px-3 py-3 text-primary-900/70">{r.workshopRating} من 5</td>
                <td className="whitespace-nowrap px-3 py-3 text-primary-900/70">{r.presenterRating} من 5</td>
                <td className="px-3 py-3 text-primary-900/70">{withOther(r.benefit, r.benefitOther)}</td>
                <td className="px-3 py-3 text-primary-900/70">{r.recommend ? "نعم" : "لا"}</td>
                <td className="max-w-56 whitespace-pre-wrap px-3 py-3 text-primary-900/70">{r.desiredTopic}</td>
                <td className="max-w-72 whitespace-pre-wrap px-3 py-3 text-primary-900/70">{r.notes}</td>
              </tr>
            ))}
            {responses.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-primary-900/50">
                  لا توجد ردود بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
