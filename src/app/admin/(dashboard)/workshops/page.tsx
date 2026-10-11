import Link from "next/link";
import { Pencil, Plus, Table2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { RegistrationControls } from "@/features/workshops/components/RegistrationControls";
import { deleteWorkshop } from "@/features/workshops/actions/admin.actions";
import { getAdminWorkshops } from "@/features/workshops/data/workshops.data";
import { formatWorkshopDate } from "@/features/workshops/lib/format";
import { getRegistrationState, type RegistrationState } from "@/features/workshops/lib/registration-window";

const stateBadge: Record<RegistrationState, { label: string; tone: "mint" | "neutral" | "mauve" }> = {
  not_opened: { label: "لم يُفتح", tone: "neutral" },
  open: { label: "مفتوح الآن", tone: "mint" },
  closed: { label: "مغلق", tone: "mauve" },
};

export default async function AdminWorkshopsPage() {
  const workshops = await getAdminWorkshops();
  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-800">الورش والشهادات</h1>
        <Link
          href="/admin/workshops/new"
          className="flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          ورشة جديدة
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-primary-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary-50/60 text-xs font-semibold text-primary-700">
            <tr>
              <th className="px-4 py-3 text-start">الورشة</th>
              <th className="px-4 py-3 text-start">التاريخ</th>
              <th className="px-4 py-3 text-start">التسجيل</th>
              <th className="px-4 py-3 text-start">الردود</th>
              <th className="px-4 py-3 text-start">تقييم الورشة</th>
              <th className="px-4 py-3 text-start">إجراءات التسجيل</th>
              <th className="px-4 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody>
            {workshops.map((workshop) => {
              const state = getRegistrationState(workshop, now);
              return (
                <tr key={workshop.id} className="border-t border-primary-50 align-middle">
                  <td className="px-4 py-3">
                    <p className="font-medium text-primary-900">{workshop.title}</p>
                    <p className="text-xs text-primary-900/50" dir="ltr">
                      /w/{workshop.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-primary-900/70" dir="ltr">
                    {formatWorkshopDate(workshop.workshopDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge label={stateBadge[state].label} tone={stateBadge[state].tone} />
                  </td>
                  <td className="px-4 py-3 text-primary-900/70">{workshop.responseCount}</td>
                  <td className="px-4 py-3 text-primary-900/70">
                    {workshop.averageWorkshopRating === null ? "—" : `${workshop.averageWorkshopRating.toFixed(1)} من 5`}
                  </td>
                  <td className="px-4 py-3">
                    <RegistrationControls
                      id={workshop.id}
                      slug={workshop.slug}
                      state={state}
                      durationMinutes={workshop.durationMinutes}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/workshops/${workshop.id}/responses`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-primary-600 hover:bg-primary-50"
                        aria-label="الردود"
                      >
                        <Table2 className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/workshops/${workshop.id}/edit`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-primary-600 hover:bg-primary-50"
                        aria-label="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteButton
                        action={deleteWorkshop.bind(null, workshop.id)}
                        confirmMessage="حذف هذه الورشة وكل ردودها نهائياً؟"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {workshops.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-primary-900/50">
                  لا توجد ورش بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
