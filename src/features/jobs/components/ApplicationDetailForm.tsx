"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/actions/types";
import { updateApplicationNotes } from "@/features/jobs/actions/application-status.actions";
import { applicationStatusLabels } from "@/features/jobs/constants/status-labels";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export function ApplicationDetailForm({
  id,
  status,
  adminNotes,
}: {
  id: string;
  status: string;
  adminNotes: string | null;
}) {
  const action = updateApplicationNotes.bind(null, id);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField label="حالة الطلب" htmlFor="status">
        <Select id="status" name="status" defaultValue={status}>
          {Object.entries(applicationStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="ملاحظات داخلية" htmlFor="adminNotes">
        <Textarea id="adminNotes" name="adminNotes" rows={5} defaultValue={adminNotes ?? ""} />
      </FormField>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>

      {state.success && <p className="text-sm text-primary-600">تم الحفظ بنجاح</p>}
    </form>
  );
}
