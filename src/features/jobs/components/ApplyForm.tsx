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
import { SuccessToast } from "@/components/ui/SuccessToast";

type Phase = "idle" | "presigning" | "uploading";

export function ApplyForm({ jobId }: { jobId: string }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(submitJobApplication, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [clientError, setClientError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  // A plain ref, not state: needs to block a second submit synchronously and
  // immediately, without waiting for a re-render — `phase`/`pending` are only
  // guaranteed to reflect "busy" after React has processed a state update,
  // which leaves a window right after the transition starts (see the end of
  // handleSubmit) where a fast double-click could slip through.
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
    // A new `state` here means submitJobApplication's transition has settled
    // (success or a server-side error) — safe to allow another submit.
    isSubmittingRef.current = false;
  }, [state]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setClientError(null);
    setResumeError(null);

    const form = formRef.current;
    if (!form) {
      isSubmittingRef.current = false;
      return;
    }

    const fileInput = form.elements.namedItem("resume") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    // Fast, no-network pre-check reusing the same schema the server trusts.
    const fileCheck = resumeFileSchema.safeParse(file);
    if (!fileCheck.success) {
      setResumeError(fileCheck.error.issues[0]?.message ?? t("jobs.applyForm.errors.invalidFile"));
      isSubmittingRef.current = false;
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
      isSubmittingRef.current = false;
      return;
    }

    setPhase("uploading");
    try {
      const uploadRes = await fetch(presignResult.uploadUrl, { method: "PUT", body: validFile });
      if (!uploadRes.ok) throw new Error(`upload failed: ${uploadRes.status}`);
    } catch {
      setPhase("idle");
      setClientError(t("jobs.applyForm.errors.uploadFailed"));
      isSubmittingRef.current = false;
      return;
    }

    snapshot.delete("resume");
    snapshot.set("resumeKey", presignResult.key);
    snapshot.set("resumeFileName", validFile.name);

    // Re-read the Turnstile token from the live DOM instead of trusting the
    // value captured in `snapshot` at click-time: Turnstile auto-refreshes
    // its hidden input in place before the original token expires, but that
    // refresh only reaches the real DOM element, not our earlier in-memory
    // FormData snapshot. On a slow upload long enough for a refresh to have
    // happened, submitting the stale captured value would fail verifyCaptcha
    // even though the widget already has a valid one sitting in the form.
    const turnstileInput = form.elements.namedItem("cf-turnstile-response") as HTMLInputElement | null;
    if (turnstileInput) {
      snapshot.set("cf-turnstile-response", turnstileInput.value);
    }

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

      <SuccessToast state={state} message={t("jobs.applyForm.success")} />
    </form>
  );
}
