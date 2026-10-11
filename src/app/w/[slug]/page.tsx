import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, UserRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ContactButtons } from "@/features/workshops/components/ContactButtons";
import { Countdown } from "@/features/workshops/components/Countdown";
import { FeedbackForm } from "@/features/workshops/components/FeedbackForm";
import { getWorkshopBySlug, responseBelongsToWorkshop } from "@/features/workshops/data/workshops.data";
import { workshopCookieName } from "@/features/workshops/lib/cookie";
import { formatWorkshopDate } from "@/features/workshops/lib/format";
import { getRegistrationState } from "@/features/workshops/lib/registration-window";

export const metadata: Metadata = { title: "نموذج التقييم" };

function Notice({ title, children, contact }: { title: string; children: React.ReactNode; contact?: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
      <Image src="/images/logo-icon.png" alt="" width={96} height={96} className="h-24 w-24" />
      <h1 className="text-xl font-bold leading-relaxed text-primary-700">{title}</h1>
      <div className="text-base leading-relaxed text-primary-900/80">{children}</div>
      {contact && <ContactButtons className="mt-2" />}
    </Card>
  );
}

export default async function WorkshopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);
  if (!workshop) notFound();

  // A student who already submitted from this browser goes straight back to
  // their certificate, even after the registration window has closed.
  const previousId = (await cookies()).get(workshopCookieName(workshop.id))?.value;
  if (previousId && (await responseBelongsToWorkshop(workshop.id, previousId))) {
    redirect(`/w/${workshop.slug}/done/${previousId}`);
  }

  const now = new Date();
  const state = getRegistrationState(workshop, now);

  if (state === "not_opened") {
    return (
      <Notice title="التسجيل لم يبدأ بعد">
        <p>سيُفتح النموذج بعد انتهاء الورشة مباشرة. ارجع إلى هذه الصفحة عندما يُشارك الرابط في المحادثة.</p>
      </Notice>
    );
  }

  if (state === "closed") {
    return (
      <Notice title="انتهى وقت التسجيل" contact>
        <p>كان النموذج متاحاً لفترة قصيرة بعد الورشة فقط. إذا حضرت الورشة ولم تتمكن من التعبئة، تواصل معنا:</p>
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white sm:p-8">
        <span aria-hidden className="absolute -start-10 -top-10 h-36 w-36 rounded-full bg-mauve-400/30" />
        <span aria-hidden className="absolute -bottom-12 -end-8 h-40 w-40 rounded-full bg-mint-300/25" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/30">
            <Image src="/images/logo-icon.png" alt="" width={64} height={64} className="h-16 w-16 rounded-full" priority />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">شهادة الحضور</h1>
            <p className="mt-1 text-base font-medium leading-relaxed text-mint-100">{workshop.title}</p>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2 text-sm">
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
            <UserRound aria-hidden className="h-4 w-4" />
            {workshop.presenterName}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
            <CalendarDays aria-hidden className="h-4 w-4" />
            <span dir="ltr">{formatWorkshopDate(workshop.workshopDate)}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-mint-50 p-5 text-base leading-loose text-primary-900/80">
        <p className="font-medium text-primary-700">نشكركم على حضوركم ومشاركتكم.</p>
        <p>
          نرجو منكم تعبئة نموذج التقييم ومشاركة آرائكم حول الورشة، حيث تُستخدم البيانات المدخلة لاستكمال إجراءات إصدار شهادة الحضور للمشاركين.
        </p>
        <p>
          نقدر وقتكم وملاحظاتكم، فهي تساعدنا على تطوير الورش والمبادرات القادمة وتقديم تجربة علمية ومهنية أفضل.
        </p>
      </div>

      <Countdown remainingMs={workshop.closesAt!.getTime() - now.getTime()} />

      <FeedbackForm slug={workshop.slug} />
    </div>
  );
}
