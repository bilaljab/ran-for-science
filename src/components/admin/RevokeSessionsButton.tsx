"use client";

import { revokeAllSessions } from "@/lib/actions/admin-session.actions";

const CONFIRM_MESSAGE =
  "سيتم تسجيل خروجك من جميع الأجهزة والجلسات، بما فيها الجلسة الحالية. هل تريد المتابعة؟";

/**
 * Same confirm-then-submit shape as DeleteButton.tsx (window.confirm inside
 * onSubmit, e.preventDefault() on decline) — this action is just as
 * immediately consequential (logs the admin out of everything, including
 * the current session), so it gets the same guard rather than firing on a
 * bare click.
 */
export function RevokeSessionsButton() {
  return (
    <form
      action={revokeAllSessions}
      onSubmit={(e) => {
        if (!confirm(CONFIRM_MESSAGE)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        تسجيل الخروج من جميع الجلسات
      </button>
    </form>
  );
}
