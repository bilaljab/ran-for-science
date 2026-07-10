"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { submitQuoteRequest } from "@/features/quotes/actions/submit.actions";
import { initialActionState } from "@/lib/actions/types";
import { serviceCategoryLabelKeys } from "@/features/quotes/constants/categories";
import { ServiceCategory } from "@/generated/prisma/enums";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/ui/Turnstile";
import { BrowserFingerprint } from "@/components/ui/BrowserFingerprint";
import { FormTimingGuard } from "@/components/ui/FormTimingGuard";
import { SuccessToast } from "@/components/ui/SuccessToast";

export function QuoteRequestForm({ defaultCategory }: { defaultCategory: ServiceCategory }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(submitQuoteRequest, initialActionState);
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

      <FormField label={t("services.quoteForm.category")} htmlFor="category" required>
        <Select id="category" name="category" defaultValue={defaultCategory}>
          {Object.values(ServiceCategory).map((category) => (
            <option key={category} value={category}>
              {t(serviceCategoryLabelKeys[category])}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label={t("services.quoteForm.companyName")} htmlFor="companyName">
        <Input id="companyName" name="companyName" />
      </FormField>

      <FormField
        label={t("services.quoteForm.contactName")}
        htmlFor="contactName"
        required
        error={state.errors?.contactName?.[0]}
      >
        <Input id="contactName" name="contactName" required invalid={!!state.errors?.contactName} />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label={t("services.quoteForm.email")}
          htmlFor="email"
          required
          error={state.errors?.email?.[0]}
        >
          <Input id="email" name="email" type="email" required invalid={!!state.errors?.email} />
        </FormField>

        <FormField
          label={t("services.quoteForm.phone")}
          htmlFor="phone"
          required
          error={state.errors?.phone?.[0]}
        >
          <Input id="phone" name="phone" type="tel" required invalid={!!state.errors?.phone} />
        </FormField>
      </div>

      <FormField
        label={t("services.quoteForm.message")}
        htmlFor="message"
        required
        error={state.errors?.message?.[0]}
      >
        <Textarea id="message" name="message" required invalid={!!state.errors?.message} />
      </FormField>

      <Turnstile />

      {/* Fixed min-height reserved from the very first render — otherwise
          the message appearing after submit would shift the button/page
          below it (CLS). */}
      <div className="min-h-5">
        {!state.success && state.message && <p className="text-sm text-red-600">{state.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("common.submitting") : t("common.requestQuote")}
      </Button>

      <SuccessToast state={state} message={t("services.quoteForm.success")} />
    </form>
  );
}
