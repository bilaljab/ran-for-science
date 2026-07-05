"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BrowserFingerprint } from "@/components/ui/BrowserFingerprint";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.replace("/admin");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <BrowserFingerprint />

      <FormField label="البريد الإلكتروني" htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoFocus />
      </FormField>

      <FormField label="كلمة المرور" htmlFor="password" required>
        <Input id="password" name="password" type="password" required />
      </FormField>

      {state.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "جارٍ الدخول..." : "دخول"}
      </Button>
    </form>
  );
}
