import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const OG_IMAGE = `${SITE_URL}/images/logo-icon.png`;

// next-intl's routing uses "as-needed" prefixes: the default locale (ar) is
// unprefixed, the other (en) is prefixed with /en. Mirror that exactly here
// so hreflang/canonical/OG URLs match the real routes.
function localizedUrl(locale: string, path: string): string {
  const suffix = path === "/" ? "" : path;
  if (locale === routing.defaultLocale) return `${SITE_URL}${suffix || "/"}`;
  return `${SITE_URL}/${locale}${suffix}`;
}

/**
 * Canonical URL for the current locale + hreflang alternates for every
 * other locale (plus x-default, defaulting to Arabic). `path` is the
 * locale-independent path, e.g. "/" or "/jobs/some-slug".
 */
export function buildAlternates(locale: string, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = localizedUrl(l, path);
  }
  languages["x-default"] = localizedUrl(routing.defaultLocale, path);

  return {
    canonical: localizedUrl(locale, path),
    languages,
  };
}

export function buildOpenGraph({
  title,
  description,
  locale,
  path,
}: {
  title: string;
  description?: string;
  locale: string;
  path: string;
}): Metadata["openGraph"] {
  return {
    title,
    description,
    url: localizedUrl(locale, path),
    siteName: "RAN For Science",
    locale: locale === "ar" ? "ar_SA" : "en_US",
    images: [{ url: OG_IMAGE, width: 512, height: 512 }],
    type: "website",
  };
}

export function buildTwitter({
  title,
  description,
}: {
  title: string;
  description?: string;
}): Metadata["twitter"] {
  return {
    card: "summary",
    title,
    description,
    images: [OG_IMAGE],
  };
}
