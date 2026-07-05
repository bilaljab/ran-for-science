"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/actions/password-reset.actions";
import { initialActionState } from "@/lib/actions/types";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => router.replace("/admin/login"), 2000);
      return () => clearTimeout(timeout);
    }
  }, [state.success, router]);

  if (state.success) {
    return <p className="text-sm text-primary-700">{state.message}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <FormField
        label="كلمة المرور الجديدة"
        htmlFor="password"
        required
        error={state.errors?.password?.[0]}
      >
        <Input id="password" name="password" type="password" required minLength={12} />
      </FormField>

      {state.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "جارٍ الحفظ..." : "تعيين كلمة المرور"}
      </Button>
    </form>
  );
}
