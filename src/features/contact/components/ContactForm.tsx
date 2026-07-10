"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { submitContactMessage } from "@/features/contact/actions/submit.actions";
import { initialActionState } from "@/lib/actions/types";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/ui/Turnstile";
import { BrowserFingerprint } from "@/components/ui/BrowserFingerprint";
import { FormTimingGuard } from "@/components/ui/FormTimingGuard";
import { SuccessToast } from "@/components/ui/SuccessToast";

export function ContactForm() {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(submitContactMessage, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <FormTimingGuard />
      <BrowserFingerprint />

      <FormField
        label={t("contact.form.name")}
        htmlFor="name"
        required
        error={state.errors?.name?.[0]}
      >
        <Input id="name" name="name" required invalid={!!state.errors?.name} />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label={t("contact.form.email")}
          htmlFor="email"
          required
          error={state.errors?.email?.[0]}
        >
          <Input id="email" name="email" type="email" required invalid={!!state.errors?.email} />
        </FormField>

        <FormField label={t("contact.form.phone")} htmlFor="phone">
          <Input id="phone" name="phone" type="tel" />
        </FormField>
      </div>

      <FormField label={t("contact.form.subject")} htmlFor="subject">
        <Input id="subject" name="subject" />
      </FormField>

      <FormField
        label={t("contact.form.message")}
        htmlFor="message"
        required
        error={state.errors?.message?.[0]}
      >
        <Textarea id="message" name="message" required invalid={!!state.errors?.message} />
      </FormField>

      <Turnstile />

      {/* Fixed min-height reserved from the very first render (not just
          when a message is present) — otherwise the message appearing
          after submit would still shift the button/page below it (CLS). */}
      <div className="min-h-5">
        {!state.success && state.message && <p className="text-sm text-red-600">{state.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("common.submitting") : t("common.send")}
      </Button>

      <SuccessToast state={state} message={t("contact.form.success")} />
    </form>
  );
}
