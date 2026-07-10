"use client";

import { Trash2 } from "lucide-react";
import { deleteQuote } from "@/features/quotes/actions/status.actions";

export function DeleteQuoteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteQuote.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("هل أنت متأكد من حذف طلب عرض السعر هذا؟")) {
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
