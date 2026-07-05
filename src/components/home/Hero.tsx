import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-primary-800 sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-900/70 sm:text-lg">
          {t("subtitle")}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link href="/jobs">
            <Button size="lg">{t("ctaJobs")}</Button>
          </Link>
          <Link href="/services">
            <Button size="lg" variant="outline">
              {t("ctaServices")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
