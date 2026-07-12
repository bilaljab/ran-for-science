import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Phone, Share2 } from "lucide-react";
import { ContactForm } from "@/features/contact/components/ContactForm";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { Card } from "@/components/ui/Card";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { ContactIllustration } from "@/components/illustrations/ContactIllustration";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const title = t("title");
  const description = t("subtitle");

  return {
    title,
    description,
    alternates: buildAlternates(locale, "/contact"),
    openGraph: buildOpenGraph({ title, description, locale, path: "/contact" }),
    twitter: buildTwitter({ title, description }),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div>
      <section className="relative overflow-hidden bg-primary-50/50 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <Reveal>
            <h1 className="text-3xl font-extrabold text-primary-800 sm:text-4xl">
              {t("contact.title")}
            </h1>
            <p className="mt-4 max-w-xl text-primary-900/70">{t("contact.subtitle")}</p>
          </Reveal>
          <Reveal delay={0.15} className="mx-auto aspect-square w-full max-w-xs">
            <ContactIllustration className="h-full w-full" />
          </Reveal>
        </div>
      </section>

      <StaggerGrid className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 md:grid-cols-3">
        <StaggerItem className="md:col-span-2">
          <ContactForm />
        </StaggerItem>

        <StaggerItem>
          <Card className="flex flex-col gap-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Phone className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-primary-700">{t("contact.info.title")}</h2>
              </div>
              <p className="text-sm text-primary-900/70">{t("contact.info.phone")}</p>
              <p className="mt-1 text-base font-semibold text-primary-800" dir="ltr">
                {t("common.phone")}
              </p>
            </div>

            <div className="border-t border-primary-100 pt-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Share2 className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-primary-700">{t("contact.info.social")}</h2>
              </div>
              <SocialLinks />
            </div>
          </Card>
        </StaggerItem>
      </StaggerGrid>
    </div>
  );
}
