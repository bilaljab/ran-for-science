import { JobForm } from "@/features/jobs/components/JobForm";
import { createJob } from "@/features/jobs/actions/admin.actions";

export default function NewJobPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">وظيفة جديدة</h1>
      <div className="mt-6 max-w-3xl">
        <JobForm action={createJob} submitLabel="إنشاء الوظيفة" />
      </div>
    </div>
  );
}
