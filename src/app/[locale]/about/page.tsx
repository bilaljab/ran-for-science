import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import { AboutContent } from "@/components/about/AboutContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("title");
  const description = t("intro");

  return {
    title,
    description,
    alternates: buildAlternates(locale, "/about"),
    openGraph: buildOpenGraph({ title, description, locale, path: "/about" }),
    twitter: buildTwitter({ title, description }),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <AboutContent
      title={t("title")}
      intro={t("intro")}
      paragraph2={t("paragraph2")}
      paragraph3={t("paragraph3")}
      mission={t("mission")}
    />
  );
}
