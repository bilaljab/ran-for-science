import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// Mirrors next-intl's "as-needed" prefix scheme (see src/lib/seo.ts): the
// default locale (ar) is unprefixed, the other (en) is prefixed with /en.
function localizedUrl(locale: string, path: string): string {
  const suffix = path === "/" ? "" : path;
  if (locale === routing.defaultLocale) return `${SITE_URL}${suffix || "/"}`;
  return `${SITE_URL}/${locale}${suffix}`;
}

const STATIC_PATHS = ["/", "/about", "/services", "/jobs", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    for (const locale of routing.locales) {
      entries.push({
        url: localizedUrl(locale, path),
        lastModified: new Date(),
        changeFrequency: path === "/" ? "daily" : "weekly",
        priority: path === "/" ? 1 : 0.7,
      });
    }
  }

  const jobs = await prisma.jobPosting.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  for (const job of jobs) {
    for (const locale of routing.locales) {
      entries.push({
        url: localizedUrl(locale, `/jobs/${job.slug}`),
        lastModified: job.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
