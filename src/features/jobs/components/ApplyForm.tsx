"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { useTranslations } from "next-intl";
import { submitJobApplication } from "@/features/jobs/actions/apply.actions";
import { presignResumeUpload } from "@/features/jobs/actions/presign-resume.actions";
import { resumeFileSchema } from "@/features/jobs/validations/application.schema";
import { initialActionState } from "@/lib/actions/types";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/ui/Turnstile";
import { BrowserFingerprint } from "@/components/ui/BrowserFingerprint";
import { FormTimingGuard } from "@/components/ui/FormTimingGuard";

type Phase = "idle" | "presigning" | "uploading";

export function ApplyForm({ jobId }: { jobId: string }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(submitJobApplication, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [clientError, setClientError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError(null);
    setResumeError(null);

    const form = formRef.current;
    if (!form) return;

    const fileInput = form.elements.namedItem("resume") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    // Fast, no-network pre-check reusing the same schema the server trusts.
    const fileCheck = resumeFileSchema.safeParse(file);
    if (!fileCheck.success) {
      setResumeError(fileCheck.error.issues[0]?.message ?? t("jobs.applyForm.errors.invalidFile"));
      return;
    }
    const validFile = fileCheck.data;

    const snapshot = new FormData(form);

    setPhase("presigning");
    const presignResult = await presignResumeUpload({
      jobId,
      website: snapshot.get("website"),
      formRenderedAt: snapshot.get("formRenderedAt"),
      fp: snapshot.get("fp"),
      fpBot: snapshot.get("fpBot"),
      fileName: validFile.name,
      fileSize: validFile.size,
      mimeType: validFile.type,
    });

    if (!presignResult.success) {
      setPhase("idle");
      setClientError(presignResult.message);
      return;
    }

    setPhase("uploading");
    try {
      const uploadRes = await fetch(presignResult.uploadUrl, { method: "PUT", body: validFile });
      if (!uploadRes.ok) throw new Error(`upload failed: ${uploadRes.status}`);
    } catch {
      setPhase("idle");
      setClientError(t("jobs.applyForm.errors.uploadFailed"));
      return;
    }

    snapshot.delete("resume");
    snapshot.set("resumeKey", presignResult.key);
    snapshot.set("resumeFileName", validFile.name);
    startTransition(() => {
      formAction(snapshot);
    });
    // From here, useActionState's own `pending` reflects submission progress
    // (see `isBusy` below) — hand off to it instead of tracking a local
    // "submitting" phase.
    setPhase("idle");
  }

  const isBusy = phase !== "idle" || pending;

  return (
    <form ref={formRef} onSubmit={handleSubmit} action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <FormTimingGuard />
      <BrowserFingerprint />

      <FormField
        label={t("jobs.applyForm.fullName")}
        htmlFor="fullName"
        required
        error={state.errors?.fullName?.[0]}
      >
        <Input id="fullName" name="fullName" required invalid={!!state.errors?.fullName} />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label={t("jobs.applyForm.email")}
          htmlFor="email"
          required
          error={state.errors?.email?.[0]}
        >
          <Input id="email" name="email" type="email" required invalid={!!state.errors?.email} />
        </FormField>

        <FormField
          label={t("jobs.applyForm.phone")}
          htmlFor="phone"
          required
          error={state.errors?.phone?.[0]}
        >
          <Input id="phone" name="phone" type="tel" required invalid={!!state.errors?.phone} />
        </FormField>
      </div>

      <FormField
        label={t("jobs.applyForm.resume")}
        htmlFor="resume"
        required
        error={resumeError ?? state.errors?.resume?.[0]}
      >
        <Input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          required
          invalid={!!(resumeError ?? state.errors?.resume)}
          className="cursor-pointer file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700"
        />
      </FormField>

      <FormField label={t("jobs.applyForm.coverNote")} htmlFor="coverNote">
        <Textarea id="coverNote" name="coverNote" />
      </FormField>

      <Turnstile />

      {/* Fixed min-height reserved from the very first render — otherwise
          the message appearing after submit would shift the button/page
          below it (CLS). */}
      <div className="min-h-5">
        {clientError && <p className="text-sm text-red-600">{clientError}</p>}
        {!clientError && !state.success && state.message && <p className="text-sm text-red-600">{state.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={isBusy}>
        {isBusy ? t("common.submitting") : t("common.applyNow")}
      </Button>

      {state.success && (
        <p className="rounded-md bg-mint-50 px-4 py-3 text-sm font-medium text-primary-700">
          {t("jobs.applyForm.success")}
        </p>
      )}
    </form>
  );
}
