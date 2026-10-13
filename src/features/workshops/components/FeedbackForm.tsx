"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { submitWorkshopResponse } from "@/features/workshops/actions/submit.actions";
import { initialActionState } from "@/lib/actions/types";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Turnstile } from "@/components/ui/Turnstile";
import { BrowserFingerprint } from "@/components/ui/BrowserFingerprint";
import { FormTimingGuard } from "@/components/ui/FormTimingGuard";
import { StarRating } from "@/features/workshops/components/StarRating";
import { RadioChoice, SelectWithOther } from "@/features/workshops/components/ChoiceFields";
import { BENEFIT_OPTIONS, CURRENT_STATUS_OPTIONS, EDUCATION_OPTIONS } from "@/features/workshops/constants/options";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

function SectionTitle({ step, children }: { step: number; children: string }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-bold leading-relaxed text-primary-700">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-100 text-sm font-bold text-primary-700">
        {step}
      </span>
      {children}
    </h2>
  );
}

export function FeedbackForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(submitWorkshopResponse.bind(null, slug), initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const err = (field: string) => state.errors?.[field]?.[0];

  // Dispatched manually (not via <form action>) because React 19 resets every
  // field after a form action — a validation error would wipe a long form.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  useEffect(() => {
    if (state.errors) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-6 [&_input]:text-base [&_select]:text-base [&_textarea]:text-base"
    >
      <input type="text" name={HONEYPOT_FIELD} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      <FormTimingGuard />
      <BrowserFingerprint />

      <Card className="flex flex-col gap-5 p-5 sm:p-6">
        <SectionTitle step={1}>بياناتك</SectionTitle>
        <FormField label="الاسم باللغة العربية" htmlFor="fullName" required error={err("fullName")}>
          <Input id="fullName" name="fullName" required autoComplete="name" maxLength={100} invalid={!!err("fullName")} aria-invalid={!!err("fullName")} />
        </FormField>
        <FormField label="الجنسية" htmlFor="nationality" required error={err("nationality")}>
          <Input id="nationality" name="nationality" required maxLength={60} invalid={!!err("nationality")} aria-invalid={!!err("nationality")} />
        </FormField>
        <SelectWithOther name="education" label="المؤهل التعليمي" options={EDUCATION_OPTIONS} error={err("education")} otherError={err("educationOther")} />
        <FormField label="التخصص" htmlFor="specialization" required error={err("specialization")}>
          <Input id="specialization" name="specialization" required maxLength={120} invalid={!!err("specialization")} aria-invalid={!!err("specialization")} />
        </FormField>
        <SelectWithOther name="currentStatus" label="الصفة الحالية" options={CURRENT_STATUS_OPTIONS} error={err("currentStatus")} otherError={err("currentStatusOther")} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="المسمى الوظيفي (إن وجد)" htmlFor="jobTitle" error={err("jobTitle")}>
            <Input id="jobTitle" name="jobTitle" maxLength={100} invalid={!!err("jobTitle")} aria-invalid={!!err("jobTitle")} />
          </FormField>
          <FormField label="سنوات الخبرة (إن وجدت)" htmlFor="yearsExperience" error={err("yearsExperience")}>
            <Input id="yearsExperience" name="yearsExperience" inputMode="numeric" maxLength={20} invalid={!!err("yearsExperience")} aria-invalid={!!err("yearsExperience")} />
          </FormField>
        </div>
        <FormField label="جهة العمل / الدراسة" htmlFor="organization" required error={err("organization")}>
          <Input id="organization" name="organization" required maxLength={150} invalid={!!err("organization")} aria-invalid={!!err("organization")} />
        </FormField>
      </Card>

      <Card className="flex flex-col gap-6 p-5 sm:p-6">
        <SectionTitle step={2}>تقييمك للورشة</SectionTitle>
        <StarRating name="workshopRating" legend="ما رأيك بالورشة بشكل عام؟" error={err("workshopRating")} />
        <StarRating name="presenterRating" legend="ما رأيك بأداء مقدم الورشة؟" error={err("presenterRating")} />
        <RadioChoice name="benefit" label="هل حققت الورشة الفائدة المرجوة؟" options={BENEFIT_OPTIONS} error={err("benefit")} otherError={err("benefitOther")} />
        <RadioChoice name="recommend" label="هل تنصح الآخرين بحضور ورش RAN؟" options={["نعم", "لا"]} error={err("recommend")} />
      </Card>

      <Card className="flex flex-col gap-5 p-5 sm:p-6">
        <SectionTitle step={3}>رأيك يهمنا</SectionTitle>
        <FormField label="ما الموضوع الذي ترغب أن نوفر لك ورشة أو دورة تدريبية عنه مستقبلًا؟" htmlFor="desiredTopic" required error={err("desiredTopic")}>
          <Textarea id="desiredTopic" name="desiredTopic" required rows={3} maxLength={500} invalid={!!err("desiredTopic")} aria-invalid={!!err("desiredTopic")} />
        </FormField>
        <FormField label="إذا كان لديك أي ملاحظات أو مقترحات أكتبها هنا" htmlFor="notes" required error={err("notes")}>
          <Textarea id="notes" name="notes" required rows={4} maxLength={2000} invalid={!!err("notes")} aria-invalid={!!err("notes")} />
        </FormField>
      </Card>

      <Turnstile />

      {/* Height reserved from the first render so the message never shifts the button (CLS). */}
      <div className="min-h-5" role="alert">
        {state.message && <p className="text-sm text-red-600">{state.message}</p>}
        {!state.message && state.errors && <p className="text-sm text-red-600">راجع الحقول المظللة ثم أعد المحاولة.</p>}
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "جارٍ الإرسال..." : "إرسال والحصول على الشهادة"}
      </Button>
    </form>
  );
}
