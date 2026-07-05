import { getQuoteRequests } from "@/features/quotes/data/quotes.data";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { updateQuoteStatus } from "@/features/quotes/actions/status.actions";
import { serviceCategoryLabelsAr } from "@/features/quotes/constants/categories-ar";
import { quoteStatusOptions } from "@/features/quotes/constants/status-labels";
import { ServiceCategory } from "@/generated/prisma/enums";

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const { category, status } = await searchParams;

  const quotes = await getQuoteRequests({ category, status });

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">طلبات عروض الأسعار</h1>

      <form className="mt-6 flex flex-wrap gap-4" method="get">
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-primary-200 bg-white px-3.5 py-2.5 text-sm"
        >
          <option value="">كل الخدمات</option>
          {Object.values(ServiceCategory).map((cat) => (
            <option key={cat} value={cat}>
              {serviceCategoryLabelsAr[cat]}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-primary-200 bg-white px-3.5 py-2.5 text-sm"
        >
          <option value="">كل الحالات</option>
          {quoteStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          تصفية
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-4">
        {quotes.map((quote) => (
          <div key={quote.id} className="rounded-lg border border-primary-100 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-primary-800">{serviceCategoryLabelsAr[quote.category]}</p>
                <p className="mt-1 text-sm text-primary-900/70">
                  {quote.contactName}
                  {quote.companyName ? ` — ${quote.companyName}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-primary-900/50" dir="ltr">
                  {quote.email} · {quote.phone}
                </p>
              </div>
              <StatusSelect id={quote.id} status={quote.status} options={quoteStatusOptions} onChange={updateQuoteStatus} />
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-primary-900/80">{quote.message}</p>
            <p className="mt-3 text-xs text-primary-900/40">
              {quote.createdAt.toLocaleString("ar-SA")}
            </p>
          </div>
        ))}

        {quotes.length === 0 && (
          <p className="rounded-lg border border-primary-100 bg-white px-4 py-8 text-center text-primary-900/50">
            لا توجد طلبات
          </p>
        )}
      </div>
    </div>
  );
}
