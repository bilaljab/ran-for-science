"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/actions/types";

const AUTO_DISMISS_MS = 4000;

/**
 * Shows a bottom-center toast whenever `state` transitions to a NEW
 * successful submission. useActionState returns a fresh object identity on
 * every dispatch, so comparing `state` by reference (not `state.success`)
 * lets two consecutive successful submissions both retrigger the toast.
 * Bumping `toastKey` happens during render (React's documented pattern for
 * reacting to a changed prop — see "storing information from previous
 * renders" in the React docs) rather than in an effect, so it isn't a
 * synchronous setState call inside an effect body. The bumped key remounts
 * ToastBubble, which is what makes aria-live re-announce the same message.
 */
export function SuccessToast({ state, message }: { state: ActionState; message: string }) {
  const [prevState, setPrevState] = useState(state);
  const [toastKey, setToastKey] = useState(0);

  if (state !== prevState) {
    setPrevState(state);
    if (state.success) {
      setToastKey((key) => key + 1);
    }
  }

  if (toastKey === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <ToastBubble key={toastKey} message={message} />
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
        "pointer-events-auto rounded-md bg-mint-50 px-4 py-3 text-sm font-medium text-primary-700 shadow-md ring-1 ring-primary-100 transition-all duration-300",
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      {message}
    </p>
  );
}
