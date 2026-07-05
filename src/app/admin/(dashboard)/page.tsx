import Link from "next/link";
import { getJobDashboardCounts } from "@/features/jobs/data/jobs.data";
import { getNewQuoteCount } from "@/features/quotes/data/quotes.data";
import { getNewMessageCount } from "@/features/contact/data/contact.data";
import { Card } from "@/components/ui/Card";

export default async function AdminDashboardPage() {
  const [{ publishedJobs, pendingApplications }, newQuotes, newMessages] = await Promise.all([
    getJobDashboardCounts(),
    getNewQuoteCount(),
    getNewMessageCount(),
  ]);

  const cards = [
    { label: "وظائف منشورة", value: publishedJobs, href: "/admin/jobs" },
    { label: "طلبات توظيف جديدة", value: pendingApplications, href: "/admin/applications" },
    { label: "طلبات عروض أسعار جديدة", value: newQuotes, href: "/admin/quotes" },
    { label: "رسائل تواصل جديدة", value: newMessages, href: "/admin/messages" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">نظرة عامة</h1>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="transition-shadow hover:shadow-md">
              <p className="text-sm text-primary-900/60">{card.label}</p>
              <p className="mt-3 text-3xl font-extrabold text-primary-700">{card.value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
