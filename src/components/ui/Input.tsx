import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
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
Input.displayName = "Input";

export { Input };
