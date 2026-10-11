"use client";

import { useState } from "react";
import { Check, Link2, Lock, RotateCcw, Unlock } from "lucide-react";
import { closeRegistration, openRegistration } from "@/features/workshops/actions/admin.actions";
import type { RegistrationState } from "@/features/workshops/lib/registration-window";

const buttonClass =
  "flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50";

export function RegistrationControls({
  id,
  slug,
  state,
  durationMinutes,
}: {
  id: string;
  slug: string;
  state: RegistrationState;
  durationMinutes: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={openRegistration.bind(null, id)}>
        <button
          type="submit"
          className={
            state === "open"
              ? buttonClass
              : "flex items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600"
          }
        >
          {state === "open" ? <RotateCcw aria-hidden className="h-3.5 w-3.5" /> : <Unlock aria-hidden className="h-3.5 w-3.5" />}
          {state === "open" ? `إعادة ضبط ${durationMinutes} دقائق` : state === "closed" ? "إعادة فتح التسجيل" : "افتح التسجيل الآن"}
        </button>
      </form>

      {state === "open" && (
        <form action={closeRegistration.bind(null, id)}>
          <button type="submit" className={buttonClass}>
            <Lock aria-hidden className="h-3.5 w-3.5" />
            أغلق الآن
          </button>
        </form>
      )}

      <button type="button" onClick={copyLink} className={buttonClass}>
        {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Link2 aria-hidden className="h-3.5 w-3.5" />}
        {copied ? "تم النسخ" : "نسخ الرابط"}
      </button>
    </div>
  );
}
