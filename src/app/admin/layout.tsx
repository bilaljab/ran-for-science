import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "../globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  // 300 (font-light) had zero usages anywhere in the codebase (grepped
  // every font-* utility class in use) — pure wasted bytes, removed.
  // Tajawal has no 600 weight at all (Google Fonts doesn't offer it, and
  // next/font's types reject it), so the existing `font-semibold` usages
  // were always going to resolve to the nearest loaded weight (700) via
  // normal CSS font-matching — not a bug introduced or fixed here, just how
  // this font family works.
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم | RAN For Science",
    template: "%s | لوحة التحكم",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-primary-50/30 text-foreground">{children}</body>
    </html>
  );
}
