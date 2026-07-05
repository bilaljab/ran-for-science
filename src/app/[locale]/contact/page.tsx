import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/features/contact/components/ContactForm";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";

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
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-primary-800 sm:text-4xl">
          {t("contact.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-primary-900/70">{t("contact.subtitle")}</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <ContactForm />
        </div>

        <div>
          <h2 className="text-lg font-bold text-primary-700">{t("contact.info.title")}</h2>
          <p className="mt-3 text-sm text-primary-900/70">{t("contact.info.phone")}</p>
          <p className="mt-1 text-base font-semibold text-primary-800" dir="ltr">
            {t("common.phone")}
          </p>

          <h2 className="mt-8 text-lg font-bold text-primary-700">{t("contact.info.social")}</h2>
          <SocialLinks className="mt-3" />
        </div>
      </div>
    </div>
  );
}
