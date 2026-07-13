function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-primary-100 ${className}`} />;
}

export default function JobsLoading() {
  return (
    <div>
      {/* Hero skeleton — matches the 2-col grid in jobs/page.tsx */}
      <section className="relative overflow-hidden bg-primary-50/50 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <Pulse className="h-9 w-3/4" />
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-2/3" />
          </div>
          <Pulse className="mx-auto aspect-square w-full max-w-sm rounded-2xl" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Filter bar skeleton */}
        <div className="flex flex-wrap gap-4">
          <Pulse className="h-10 w-36" />
          <Pulse className="h-10 w-36" />
          <Pulse className="h-10 w-20" />
        </div>

        {/* Job cards grid skeleton — 6 cards matching JobCard layout */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-primary-100 bg-white p-5">
              <div className="flex gap-2">
                <Pulse className="h-5 w-16 rounded-full" />
                <Pulse className="h-5 w-20 rounded-full" />
              </div>
              <Pulse className="mt-3 h-5 w-4/5" />
              <Pulse className="mt-2 h-4 w-1/2" />
              <Pulse className="mt-4 h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
