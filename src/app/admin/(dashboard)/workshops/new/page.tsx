import { WorkshopForm } from "@/features/workshops/components/WorkshopForm";
import { createWorkshop } from "@/features/workshops/actions/admin.actions";
import { requireAdminPage } from "@/lib/require-admin";

export default async function NewWorkshopPage() {
  await requireAdminPage();
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">ورشة جديدة</h1>
      <div className="mt-6 max-w-2xl">
        <WorkshopForm action={createWorkshop} submitLabel="إنشاء الورشة" />
      </div>
    </div>
  );
}
