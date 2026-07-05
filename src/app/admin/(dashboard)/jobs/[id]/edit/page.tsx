import { notFound } from "next/navigation";
import { getJobById } from "@/features/jobs/data/jobs.data";
import { JobForm } from "@/features/jobs/components/JobForm";
import { updateJob } from "@/features/jobs/actions/admin.actions";
import { idSchema } from "@/lib/validation";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  const job = await getJobById(parsedId.data);
  if (!job) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">تعديل الوظيفة</h1>
      <div className="mt-6 max-w-3xl">
        <JobForm action={updateJob.bind(null, parsedId.data)} defaultValues={job} submitLabel="حفظ التعديلات" />
      </div>
    </div>
  );
}
