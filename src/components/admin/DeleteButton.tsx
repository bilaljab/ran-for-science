"use client";

import { Trash2 } from "lucide-react";

/**
 * Shared confirm-then-delete icon button for the admin dashboard — used for
 * job applications, quote requests, and contact messages, each just binding
 * their own delete Server Action and confirmation text.
 */
export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="حذف"
        className="flex h-8 w-8 items-center justify-center rounded-md text-primary-900/50 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
