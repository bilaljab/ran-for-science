import { notFound } from "next/navigation";
import { WorkshopForm } from "@/features/workshops/components/WorkshopForm";
import { updateWorkshop } from "@/features/workshops/actions/admin.actions";
import { getWorkshopForAdmin } from "@/features/workshops/data/workshops.data";
import { toDateInputValue } from "@/features/workshops/lib/format";
import { idSchema } from "@/lib/validation";
import { requireAdminPage } from "@/lib/require-admin";

export default async function EditWorkshopPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  const workshop = await getWorkshopForAdmin(parsedId.data);
  if (!workshop) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">تعديل الورشة</h1>
      <div className="mt-6 max-w-2xl">
        <WorkshopForm
          action={updateWorkshop.bind(null, parsedId.data)}
          defaultValues={{ ...workshop, workshopDate: toDateInputValue(workshop.workshopDate) }}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </div>
  );
}
