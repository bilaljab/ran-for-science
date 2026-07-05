import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function ServiceCard({
  title,
  description,
  href,
  ctaLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-primary-100 bg-white p-5">
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
