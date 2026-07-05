"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/password-reset.actions";
import { initialActionState } from "@/lib/actions/types";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialActionState);

  if (state.success) {
    return <p className="text-sm text-primary-700">{state.message}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField label="البريد الإلكتروني" htmlFor="email" required error={state.errors?.email?.[0]}>
        <Input id="email" name="email" type="email" required autoFocus />
      </FormField>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
      </Button>
    </form>
  );
}
