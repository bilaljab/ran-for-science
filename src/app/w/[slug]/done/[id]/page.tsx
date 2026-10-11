import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { CertificateDownload } from "@/features/workshops/components/CertificateDownload";
import { ContactButtons } from "@/features/workshops/components/ContactButtons";
import { getCertificateData } from "@/features/workshops/data/workshops.data";
import { formatWorkshopDate } from "@/features/workshops/lib/format";
import { idSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "شهادتك جاهزة" };

export default async function CertificatePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const response = await getCertificateData(parsedId.data);
  // The token only works under its own workshop's slug.
  if (!response || response.workshop.slug !== slug) notFound();

  const { workshop } = response;
  const firstName = response.fullName.split(" ")[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
      <div className="relative flex flex-col items-center gap-3 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 px-6 pb-8 pt-8 text-center text-white">
        <span aria-hidden className="absolute -start-10 -top-10 h-36 w-36 rounded-full bg-mauve-400/30" />
        <span aria-hidden className="absolute -bottom-12 -end-8 h-40 w-40 rounded-full bg-mint-300/25" />
        <span aria-hidden className="absolute end-10 top-6 h-3 w-3 rounded-full bg-mint-200" />
        <span aria-hidden className="absolute start-12 top-24 h-2.5 w-2.5 rounded-full bg-mauve-200" />
        <span aria-hidden className="absolute bottom-10 start-1/4 h-2 w-2 rounded-full bg-white/70" />

        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/30">
          <Image src="/images/logo-icon.png" alt="" width={80} height={80} className="h-20 w-20 rounded-full" />
          <span className="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-full bg-mauve-400 text-white shadow">
            <PartyPopper aria-hidden className="h-5 w-5" />
          </span>
        </div>
        <h1 className="relative text-2xl font-extrabold leading-snug sm:text-3xl">مبروك يا {firstName}!</h1>
        <p className="relative max-w-md text-base leading-relaxed text-white/90">
          شهادة حضورك في «{workshop.title}» جاهزة. شكرًا لكونك جزءًا من مجتمع RAN For Science.
        </p>
        <p className="relative rounded-full bg-white/15 px-3 py-1 text-sm text-white/90">
          <span dir="ltr">{formatWorkshopDate(workshop.workshopDate)}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-8 p-6 sm:p-8">
        <CertificateDownload
          data={{
            fullName: response.fullName,
            title: workshop.title,
            typeLabel: workshop.typeLabel,
            presenterName: workshop.presenterName,
            date: formatWorkshopDate(workshop.workshopDate),
          }}
        />

        <div className="flex w-full flex-col items-center gap-4 border-t border-primary-100 pt-8 text-center">
          <h2 className="text-lg font-bold text-primary-700">ابقَ على تواصل معنا</h2>
          <p className="max-w-md text-base leading-loose text-primary-900/80">
            انضموا إلى مجتمع RAN البيئي لمتابعة أحدث الدورات والفرص البيئية.
          </p>
          <ContactButtons />
        </div>
      </div>
    </div>
  );
}
