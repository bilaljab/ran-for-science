import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/layout/FloatingWhatsAppButton";
import "../globals.css";

const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// Prerenders likely-next public pages on ~200ms hover, collapsing their LCP
// to near-zero for the (very common) case of a user browsing home -> jobs ->
// a job listing, etc. Scoped to same-origin public pages only — /admin and
// /api are excluded since prerendering an auth-gated or non-navigable route
// has no benefit and only wastes bandwidth. Chromium-only; other browsers
// ignore this script entirely (progressive enhancement, never a regression).
// See src/components/ui/FormTimingGuard.tsx for how the anti-bot timing
// trap avoids being weakened by a prerender starting the clock early.
const SPECULATION_RULES = JSON.stringify({
  prerender: [
    {
      where: {
        and: [{ href_matches: "/*" }, { not: { href_matches: "/admin/*" } }, { not: { href_matches: "/api/*" } }],
      },
      eagerness: "moderate",
    },
  ],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  // 300 (font-light) had zero usages anywhere in the codebase (grepped
  // every font-* utility class in use) — pure wasted bytes, removed.
  // Tajawal has no 600 weight at all (Google Fonts doesn't offer it, and
  // next/font's types reject it), so the 15 existing `font-semibold`
  // usages were always going to resolve to the nearest loaded weight (700)
  // via normal CSS font-matching — not a bug introduced or fixed here,
  // just how this font family works.
  weight: ["400", "500", "700", "800"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("siteName"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("tagline"),
    icons: {
      icon: [
        { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/images/favicon-16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: "/images/apple-touch-icon.png",
    },
    // Site-wide fallback for any page that doesn't set its own — every
    // page below does, so this is only hit for not-found/error boundaries.
    openGraph: buildOpenGraph({ title: t("siteName"), description: t("tagline"), locale, path: "/" }),
    twitter: buildTwitter({ title: t("siteName"), description: t("tagline") }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${tajawal.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script type="speculationrules" dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }} />
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingWhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
