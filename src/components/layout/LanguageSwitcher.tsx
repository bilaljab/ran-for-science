"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => {
        router.replace(pathname, { locale: nextLocale });
      }}
      className={cn(
        "rounded-md border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50",
        className
      )}
    >
      {nextLocale === "ar" ? "العربية" : "English"}
    </button>
  );
}
