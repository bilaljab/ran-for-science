"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

// Submit button that reacts INSTANTLY to a click (spinner + disabled) while the
// Server Action runs — the action itself takes a moment in production, and a
// button that looks idle in the meantime reads as "nothing happened".
export function PendingSubmit({ className, children }: { className: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:cursor-wait disabled:opacity-70`}>
      {pending ? <LoaderCircle aria-hidden className="h-3.5 w-3.5 animate-spin" /> : children}
      {pending && "جارٍ التنفيذ..."}
    </button>
  );
}
