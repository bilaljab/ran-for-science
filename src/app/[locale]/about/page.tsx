import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";

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
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-primary-800 sm:text-4xl">{t("title")}</h1>

      <div className="mt-8 flex flex-col gap-5 text-base leading-relaxed text-primary-900/80">
        <p>{t("intro")}</p>
        <p>{t("paragraph2")}</p>
        <p>{t("paragraph3")}</p>
      </div>

      <blockquote className="mt-10 rounded-xl border-s-4 border-mauve-400 bg-mauve-50 p-6 text-lg font-medium leading-relaxed text-primary-800">
        {t("mission")}
      </blockquote>
    </section>
  );
}
