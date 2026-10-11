"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_RATING } from "@/features/workshops/constants/options";

const STAR_LABELS = ["ضعيف جداً", "ضعيف", "جيد", "جيد جداً", "ممتاز"];

// Native radios (visually hidden) keep arrow-key navigation and screen-reader
// semantics for free; the stars are just the labels.
export function StarRating({ name, legend, error }: { name: string; legend: string; error?: string }) {
  const [value, setValue] = useState(0);

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-primary-700">
        {legend}
        <span className="ms-1 text-mauve-600">*</span>
      </legend>
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((n) => (
          <label
            key={n}
            className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-400"
          >
            <input
              type="radio"
              name={name}
              value={n}
              required
              checked={value === n}
              onChange={() => setValue(n)}
              className="sr-only"
              aria-label={`${n} من ${MAX_RATING} — ${STAR_LABELS[n - 1]}`}
            />
            <Star
              aria-hidden
              className={cn("h-8 w-8 transition-colors", n <= value ? "fill-mauve-400 text-mauve-500" : "text-primary-200")}
            />
          </label>
        ))}
        <span className="ms-2 min-w-16 text-sm text-primary-900/70" aria-hidden>
          {value ? STAR_LABELS[value - 1] : ""}
        </span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}
