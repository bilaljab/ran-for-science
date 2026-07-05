"use client";

import { useActionState } from "react";
import { verifyEmail } from "@/lib/actions/email-verification.actions";
import { initialActionState } from "@/lib/actions/types";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(verifyEmail, initialActionState);

  if (state.success) {
    return <p className="text-sm text-primary-700">{state.message}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      {state.message && <p className="text-sm text-red-600">{state.message}</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "جارٍ التأكيد..." : "تأكيد البريد الإلكتروني"}
      </Button>
    </form>
  );
}
