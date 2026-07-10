import type { Metadata } from "next";
import { Layers, Globe, CircleCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ServiceCard } from "@/components/services/ServiceCard";
import { QuoteRequestForm } from "@/features/quotes/components/QuoteRequestForm";
import { categoryGroups, serviceCategoryLabelKeys } from "@/features/quotes/constants/categories";
import { ServiceCategory } from "@/generated/prisma/enums";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  const title = t("title");
  const description = t("subtitle");

  return {
    title,
    description,
    alternates: buildAlternates(locale, "/services"),
    openGraph: buildOpenGraph({ title, description, locale, path: "/services" }),
    twitter: buildTwitter({ title, description }),
  };
}

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const { category } = await searchParams;
  const validCategories = Object.values(ServiceCategory) as string[];
  const defaultCategory = validCategories.includes(category ?? "")
    ? (category as ServiceCategory)
    : ServiceCategory.FREE_CONSULTATION;

  // Real, computed counts (never hardcoded) so this can't drift out of sync
  // with the actual service catalog below.
  const totalServices = categoryGroups.reduce((sum, group) => sum + group.categories.length, 0);
  const totalAreas = categoryGroups.length;

  return (
    <div>
      <section className="bg-primary-50/50 px-4 py-14 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold text-primary-800 sm:text-4xl">
          {t("services.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-primary-900/70">{t("services.subtitle")}</p>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-4 sm:flex-row sm:justify-center">
          <div className="flex items-center justify-center gap-2 rounded-lg border border-primary-100 bg-white px-5 py-3 text-sm font-medium text-primary-800 sm:flex-1">
            <Layers className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
            {t("services.trust.servicesCount", { count: totalServices })}
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-primary-100 bg-white px-5 py-3 text-sm font-medium text-primary-800 sm:flex-1">
            <Globe className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
            {t("services.trust.coverageAreas", { count: totalAreas })}
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-primary-100 bg-white px-5 py-3 text-sm font-medium text-primary-800 sm:flex-1">
            <CircleCheck className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
            {t("services.trust.freeConsultation")}
          </div>
        </div>
      </section>

      {/* Free services */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-primary-800">{t("services.freeTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-primary-900/70">{t("services.freeSubtitle")}</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ServiceCard
            title={t("services.free.jobPosting.title")}
            description={t("services.free.jobPosting.description")}
            href="/contact"
            ctaLabel={t("nav.contact")}
          />
          <ServiceCard
            title={t("services.free.cvScreening.title")}
            description={t("services.free.cvScreening.description")}
            href="/contact"
            ctaLabel={t("nav.contact")}
          />
          <ServiceCard
            title={t("services.free.consultation.title")}
            description={t("services.free.consultation.description")}
            href={`/services?category=${ServiceCategory.FREE_CONSULTATION}#quote-form`}
            ctaLabel={t("common.requestQuote")}
          />
        </div>
      </section>

      {/* Paid services */}
      <section className="bg-primary-50/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-primary-800">{t("services.paidTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-primary-900/70">{t("services.paidSubtitle")}</p>

          <div className="mt-8 flex flex-col gap-10">
            {categoryGroups.map((group) => (
              <div key={group.key}>
                <h3 className="text-lg font-bold text-primary-700">{t(group.titleKey)}</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.categories.map((cat) => (
                    <ServiceCard
                      key={cat}
                      title={t(serviceCategoryLabelKeys[cat])}
                      href={`/services?category=${cat}#quote-form`}
                      ctaLabel={t("common.requestQuote")}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote request form */}
      <section id="quote-form" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-primary-800">{t("services.quoteForm.title")}</h2>
        <p className="mt-2 text-sm text-primary-900/70">{t("services.quoteForm.subtitle")}</p>
        <div className="mt-8">
          <QuoteRequestForm key={defaultCategory} defaultCategory={defaultCategory} />
        </div>
      </section>
    </div>
  );
}
