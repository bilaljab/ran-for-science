import type { Metadata } from "next";
import { Layers, Globe, CircleCheck, Briefcase, FileSearch, MessageCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ServiceCard } from "@/components/services/ServiceCard";
import { QuoteRequestForm } from "@/features/quotes/components/QuoteRequestForm";
import { categoryGroups, categoryGroupIcons, serviceCategoryLabelKeys } from "@/features/quotes/constants/categories";
import { ServiceCategory } from "@/generated/prisma/enums";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { TiltCard } from "@/components/motion/TiltCard";
import { ServicesIllustration } from "@/components/illustrations/ServicesIllustration";
import { cn } from "@/lib/utils";

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
      <section className="relative overflow-hidden bg-primary-50/50 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <Reveal>
            <h1 className="text-3xl font-extrabold text-primary-800 sm:text-4xl">
              {t("services.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-primary-900/70">{t("services.subtitle")}</p>

            <StaggerGrid className="mt-8 flex flex-col gap-4 sm:flex-row">
              <StaggerItem className="flex items-center justify-center gap-2 rounded-lg border border-primary-100 bg-white px-5 py-3 text-sm font-medium text-primary-800 sm:flex-1">
                <Layers className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
                {t("services.trust.servicesCount", { count: totalServices })}
              </StaggerItem>
              <StaggerItem className="flex items-center justify-center gap-2 rounded-lg border border-primary-100 bg-white px-5 py-3 text-sm font-medium text-primary-800 sm:flex-1">
                <Globe className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
                {t("services.trust.coverageAreas", { count: totalAreas })}
              </StaggerItem>
              <StaggerItem className="flex items-center justify-center gap-2 rounded-lg border border-primary-100 bg-white px-5 py-3 text-sm font-medium text-primary-800 sm:flex-1">
                <CircleCheck className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
                {t("services.trust.freeConsultation")}
              </StaggerItem>
            </StaggerGrid>
          </Reveal>

          <Reveal delay={0.15} className="mx-auto aspect-square w-full max-w-sm">
            <ServicesIllustration className="h-full w-full" />
          </Reveal>
        </div>
      </section>

      {/* Free services */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-primary-800">{t("services.freeTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-primary-900/70">{t("services.freeSubtitle")}</p>

        <StaggerGrid className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StaggerItem>
            <TiltCard spotlight>
              <ServiceCard
                title={t("services.free.jobPosting.title")}
                description={t("services.free.jobPosting.description")}
                href="/contact"
                ctaLabel={t("nav.contact")}
                icon={<Briefcase className="h-5 w-5" />}
              />
            </TiltCard>
          </StaggerItem>
          <StaggerItem>
            <TiltCard spotlight>
              <ServiceCard
                title={t("services.free.cvScreening.title")}
                description={t("services.free.cvScreening.description")}
                href="/contact"
                ctaLabel={t("nav.contact")}
                icon={<FileSearch className="h-5 w-5" />}
              />
            </TiltCard>
          </StaggerItem>
          <StaggerItem>
            <TiltCard spotlight>
              <ServiceCard
                title={t("services.free.consultation.title")}
                description={t("services.free.consultation.description")}
                href={`/services?category=${ServiceCategory.FREE_CONSULTATION}#quote-form`}
                ctaLabel={t("common.requestQuote")}
                icon={<MessageCircle className="h-5 w-5" />}
              />
            </TiltCard>
          </StaggerItem>
        </StaggerGrid>
      </section>

      {/* Paid services */}
      <section className="bg-primary-50/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-primary-800">{t("services.paidTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-primary-900/70">{t("services.paidSubtitle")}</p>

          <div className="mt-8 flex flex-col gap-10">
            {categoryGroups.map((group) => {
              const GroupIcon = categoryGroupIcons[group.key];
              return (
                <div key={group.key}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <GroupIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-primary-700">{t(group.titleKey)}</h3>
                  </div>
                  <StaggerGrid className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.categories.map((cat, i) => (
                      <StaggerItem key={cat} className={cn(i === 0 && "sm:col-span-2")}>
                        <TiltCard spotlight>
                          <ServiceCard
                            title={t(serviceCategoryLabelKeys[cat])}
                            href={`/services?category=${cat}#quote-form`}
                            ctaLabel={t("common.requestQuote")}
                            className={cn(i === 0 && "bg-primary-50/40")}
                          />
                        </TiltCard>
                      </StaggerItem>
                    ))}
                  </StaggerGrid>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quote request form */}
      <section id="quote-form" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Reveal>
          <h2 className="text-2xl font-bold text-primary-800">{t("services.quoteForm.title")}</h2>
          <p className="mt-2 text-sm text-primary-900/70">{t("services.quoteForm.subtitle")}</p>
        </Reveal>
        <div className="mt-8">
          <QuoteRequestForm key={defaultCategory} defaultCategory={defaultCategory} />
        </div>
      </section>
    </div>
  );
}
