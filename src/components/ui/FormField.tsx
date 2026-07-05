import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-primary-700">
        {label}
        {required && <span className="text-mauve-600 ms-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
