import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function ServiceCard({
  title,
  description,
  href,
  ctaLabel,
  icon,
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col rounded-lg border border-primary-100 bg-white p-5", className)}>
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
      )}
      <h4 className="font-semibold text-primary-800">{title}</h4>
      {description && <p className="mt-2 text-sm text-primary-900/65">{description}</p>}
      {href && ctaLabel && (
        <Link href={href} className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
