"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { cn } from "@/lib/utils";

export default function Header() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/jobs", label: t("jobs") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-primary-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-icon.png"
            alt={tc("siteName")}
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="text-lg font-bold text-primary-700">{tc("siteName")}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary-600",
                pathname === link.href ? "text-primary-600" : "text-primary-900/80"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <SocialLinks />
          <LanguageSwitcher />
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-primary-700 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-primary-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-sm font-medium",
                  pathname === link.href ? "text-primary-600" : "text-primary-900/80"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between">
            <SocialLinks />
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
