"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const AUTO_DISMISS_MS = 4000;

/**
 * Shows a bottom-center error toast each time `triggerKey` increments.
 * Sibling to SuccessToast.tsx, same mechanism (a fresh key remounts the
 * bubble, which is what makes aria-live re-announce on repeated triggers) —
 * adapted for callers with no useActionState `state` object to compare by
 * identity: the caller just bumps a counter on failure.
 */
export function ErrorToast({ triggerKey, message }: { triggerKey: number; message: string }) {
  if (triggerKey === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <ToastBubble key={triggerKey} message={message} />
    </div>
  );
}

function ToastBubble({ message }: { message: string }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => setEntered(true));
    const hideTimer = setTimeout(() => setEntered(false), AUTO_DISMISS_MS);
    return () => {
      cancelAnimationFrame(enterFrame);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-md ring-1 ring-red-100 transition-all duration-300",
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      {message}
    </p>
  );
}
