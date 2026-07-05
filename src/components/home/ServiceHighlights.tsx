import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function ServiceHighlights() {
  const t = useTranslations("home.highlights");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-2xl font-bold text-primary-800 sm:text-3xl">{t("title")}</h2>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <Badge tone="mint" className="w-fit">
            {t("freeTitle")}
          </Badge>
          <p className="mt-4 flex-1 text-sm leading-relaxed text-primary-900/70">
            {t("freeDescription")}
          </p>
          <Link
            href="/services"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            {t("freeCta")}
            <ArrowLeft className="h-4 w-4 rotate-180 rtl:rotate-0" />
          </Link>
        </Card>

        <Card className="flex flex-col">
          <Badge tone="mauve" className="w-fit">
            {t("paidTitle")}
          </Badge>
          <p className="mt-4 flex-1 text-sm leading-relaxed text-primary-900/70">
            {t("paidDescription")}
          </p>
          <Link
            href="/services"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            {t("paidCta")}
            <ArrowLeft className="h-4 w-4 rotate-180 rtl:rotate-0" />
          </Link>
        </Card>
      </div>
    </section>
  );
}
