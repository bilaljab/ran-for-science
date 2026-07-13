function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-primary-100 ${className}`} />;
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <Pulse className="h-8 w-48 rounded-lg" />

      {/* Table skeleton — matches the majority of admin pages */}
      <div className="overflow-hidden rounded-lg border border-primary-100 bg-white">
        <div className="border-b border-primary-100 bg-primary-50/60 px-4 py-3">
          <div className="grid grid-cols-4 gap-6">
            <Pulse className="h-3.5 w-full" />
            <Pulse className="h-3.5 w-full" />
            <Pulse className="h-3.5 w-3/4" />
            <Pulse className="h-3.5 w-1/2" />
          </div>
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="grid grid-cols-4 gap-6 border-t border-primary-50 px-4 py-3.5">
            <Pulse className="h-3.5 w-full" />
            <Pulse className="h-3.5 w-4/5" />
            <Pulse className="h-3.5 w-3/5" />
            <Pulse className="h-3.5 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
