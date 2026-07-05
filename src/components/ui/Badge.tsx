import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "mint" | "mauve" | "neutral";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-50 text-primary-700",
  mint: "bg-mint-100 text-primary-700",
  mauve: "bg-mauve-100 text-mauve-600",
  neutral: "bg-gray-100 text-gray-600",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
