"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface WorkshopFormValues {
  slug?: string;
  title?: string;
  typeLabel?: string;
  presenterName?: string;
  workshopDate?: string;
  durationMinutes?: number;
}

export function WorkshopForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: WorkshopFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  // Dispatched manually (not via <form action>) because React 19 resets every
  // field after a form action, which would wipe the form on a validation error.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormField label="عنوان الورشة (كما سيظهر في الشهادة)" htmlFor="title" required error={state.errors?.title?.[0]}>
        <Input id="title" name="title" defaultValue={defaultValues?.title} required maxLength={200} />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="نوع الفعالية" htmlFor="typeLabel" required error={state.errors?.typeLabel?.[0]}>
          <Input id="typeLabel" name="typeLabel" defaultValue={defaultValues?.typeLabel ?? "ورشة عمل"} required maxLength={60} />
        </FormField>
        <FormField label="تاريخ الورشة" htmlFor="workshopDate" required error={state.errors?.workshopDate?.[0]}>
          <Input id="workshopDate" name="workshopDate" type="date" defaultValue={defaultValues?.workshopDate} required />
        </FormField>
      </div>

      <FormField
        label="اسم المقدم مع اللقب (كما سيظهر في الشهادة)"
        htmlFor="presenterName"
        required
        error={state.errors?.presenterName?.[0]}
      >
        <Input id="presenterName" name="presenterName" defaultValue={defaultValues?.presenterName} required maxLength={150} />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="الرابط المختصر (اختياري، يُنشأ تلقائياً إذا تركتِه فارغاً)"
          htmlFor="slug"
          error={state.errors?.slug?.[0]}
        >
          <Input id="slug" name="slug" dir="ltr" defaultValue={defaultValues?.slug} maxLength={60} placeholder="تلقائي" />
        </FormField>
        <FormField
          label="مدة فتح التسجيل (دقائق)"
          htmlFor="durationMinutes"
          required
          error={state.errors?.durationMinutes?.[0]}
        >
          <Input id="durationMinutes" name="durationMinutes" type="number" min={1} max={120} defaultValue={defaultValues?.durationMinutes ?? 10} required />
        </FormField>
      </div>

      {state.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-fit">
        {pending ? "جارٍ الحفظ..." : submitLabel}
      </Button>
    </form>
  );
}
