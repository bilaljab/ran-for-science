function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-primary-100 ${className}`} />;
}

export default function JobDetailLoading() {
  return (
    <div>
      {/* Hero skeleton — badges + h1 + location, matches jobs/[slug]/page.tsx */}
      <section className="relative overflow-hidden bg-primary-50/50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex gap-2">
            <Pulse className="h-5 w-16 rounded-full" />
            <Pulse className="h-5 w-20 rounded-full" />
          </div>
          <Pulse className="h-9 w-3/4" />
          <Pulse className="h-4 w-32" />
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        {/* Description block */}
        <div className="space-y-3">
          <Pulse className="h-5 w-40" />
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-5/6" />
          <Pulse className="h-4 w-4/5" />
        </div>

        {/* Requirements block */}
        <div className="space-y-3">
          <Pulse className="h-5 w-32" />
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-11/12" />
          <Pulse className="h-4 w-3/4" />
        </div>

        {/* Apply form block — rounded-xl border border-primary-100 bg-primary-50/40 */}
        <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-6 sm:p-8">
          <Pulse className="h-7 w-48" />
          <div className="mt-6 space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Pulse className="h-3.5 w-24" />
                <Pulse className="h-10 w-full rounded-md" />
              </div>
            ))}
            <Pulse className="mt-2 h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
