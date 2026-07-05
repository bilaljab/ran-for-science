"use client";

import { useActionState } from "react";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { JobType, JobStatus } from "@/generated/prisma/enums";

const jobTypeLabels: Record<string, string> = {
  FULL_TIME: "دوام كامل",
  PART_TIME: "دوام جزئي",
  CONTRACT: "عقد",
  INTERNSHIP: "تدريب",
  REMOTE: "عن بُعد",
};

const jobStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشورة",
  CLOSED: "مغلقة",
};

type JobFormValues = {
  slug?: string;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  requirementsAr?: string | null;
  requirementsEn?: string | null;
  field?: string | null;
  location?: string | null;
  jobType?: string;
  status?: string;
};

export function JobForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: JobFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="الرابط المختصر (slug، أحرف لاتينية وأرقام وشرطات)"
          htmlFor="slug"
          required
          error={state.errors?.slug?.[0]}
        >
          <Input id="slug" name="slug" defaultValue={defaultValues?.slug} dir="ltr" required />
        </FormField>

        <FormField label="المجال" htmlFor="field">
          <Input id="field" name="field" defaultValue={defaultValues?.field ?? ""} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="المسمى الوظيفي (عربي)"
          htmlFor="titleAr"
          required
          error={state.errors?.titleAr?.[0]}
        >
          <Input id="titleAr" name="titleAr" defaultValue={defaultValues?.titleAr} required />
        </FormField>
        <FormField
          label="المسمى الوظيفي (إنجليزي)"
          htmlFor="titleEn"
          required
          error={state.errors?.titleEn?.[0]}
        >
          <Input id="titleEn" name="titleEn" defaultValue={defaultValues?.titleEn} dir="ltr" required />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="الوصف الوظيفي (عربي)"
          htmlFor="descriptionAr"
          required
          error={state.errors?.descriptionAr?.[0]}
        >
          <Textarea id="descriptionAr" name="descriptionAr" rows={6} defaultValue={defaultValues?.descriptionAr} required />
        </FormField>
        <FormField
          label="الوصف الوظيفي (إنجليزي)"
          htmlFor="descriptionEn"
          required
          error={state.errors?.descriptionEn?.[0]}
        >
          <Textarea
            id="descriptionEn"
            name="descriptionEn"
            rows={6}
            dir="ltr"
            defaultValue={defaultValues?.descriptionEn}
            required
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="المتطلبات (عربي)" htmlFor="requirementsAr">
          <Textarea id="requirementsAr" name="requirementsAr" rows={4} defaultValue={defaultValues?.requirementsAr ?? ""} />
        </FormField>
        <FormField label="المتطلبات (إنجليزي)" htmlFor="requirementsEn">
          <Textarea
            id="requirementsEn"
            name="requirementsEn"
            rows={4}
            dir="ltr"
            defaultValue={defaultValues?.requirementsEn ?? ""}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <FormField label="الموقع" htmlFor="location">
          <Input id="location" name="location" defaultValue={defaultValues?.location ?? ""} />
        </FormField>

        <FormField label="نوع الدوام" htmlFor="jobType">
          <Select id="jobType" name="jobType" defaultValue={defaultValues?.jobType ?? JobType.FULL_TIME}>
            {Object.values(JobType).map((type) => (
              <option key={type} value={type}>
                {jobTypeLabels[type]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="الحالة" htmlFor="status">
          <Select id="status" name="status" defaultValue={defaultValues?.status ?? JobStatus.DRAFT}>
            {Object.values(JobStatus).map((status) => (
              <option key={status} value={status}>
                {jobStatusLabels[status]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {state.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-fit">
        {pending ? "جارٍ الحفظ..." : submitLabel}
      </Button>
    </form>
  );
}
