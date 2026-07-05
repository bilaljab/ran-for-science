import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SocialLinks } from "@/components/layout/SocialLinks";

export default function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");

  const links = [
    { href: "/", label: tn("home") },
    { href: "/about", label: tn("about") },
    { href: "/services", label: tn("services") },
    { href: "/jobs", label: tn("jobs") },
    { href: "/contact", label: tn("contact") },
  ];

  return (
    <footer className="border-t border-primary-100 bg-primary-50/40">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-icon.png"
              alt={tc("siteName")}
              width={36}
              height={36}
              className="h-9 w-9"
            />
            <span className="text-lg font-bold text-primary-700">{tc("siteName")}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-primary-900/70">{t("about")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary-700">{t("quickLinks")}</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-primary-900/70 transition-colors hover:text-primary-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary-700">{t("contactUs")}</h3>
          <p className="mt-4 text-sm text-primary-900/70" dir="ltr">
            {tc("phone")}
          </p>
          <h3 className="mt-6 text-sm font-semibold text-primary-700">{t("followUs")}</h3>
          <SocialLinks className="mt-4" />
        </div>
      </div>

      <div className="border-t border-primary-100 py-5 text-center text-xs text-primary-900/60">
        © {new Date().getFullYear()} {tc("siteName")} — {t("rights")}
      </div>
    </footer>
  );
}
