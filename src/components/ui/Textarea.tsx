import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400",
          invalid ? "border-red-400" : "border-primary-200",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
