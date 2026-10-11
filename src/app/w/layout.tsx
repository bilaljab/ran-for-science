import type { Metadata } from "next";
import Image from "next/image";
import { Tajawal } from "next/font/google";
import { ContactButtons } from "@/features/workshops/components/ContactButtons";
import "../globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "شهادة الحضور | RAN For Science",
    template: "%s | RAN For Science",
  },
  robots: { index: false, follow: false },
};

export default function WorkshopRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-primary-50/30 text-foreground">
        <header className="border-b border-primary-100 bg-white">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <Image src="/images/logo-icon.png" alt="" width={40} height={40} className="h-10 w-10" priority />
            <span className="text-lg font-bold text-primary-700">RAN For Science</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">{children}</main>

        <footer className="border-t border-primary-100 bg-primary-50/40 py-6 text-center text-sm leading-relaxed text-primary-900/70">
          <div className="mx-auto max-w-2xl px-4">
            <p className="mb-3">تابعوا أحدث الدورات والفرص البيئية مع مجتمع RAN</p>
            <ContactButtons compact />
          </div>
        </footer>
      </body>
    </html>
  );
}
