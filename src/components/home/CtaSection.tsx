import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function CtaSection() {
  const t = useTranslations("home.cta");

  return (
    <section className="bg-primary-700">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("title")}</h2>
        <p className="mt-4 text-primary-100">{t("subtitle")}</p>
        <Link
          href="/contact"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-7 py-3 text-base font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
