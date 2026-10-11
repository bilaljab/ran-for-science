// Horizontal share bars: label, count and percentage are all printed as text,
// so the bar length is decoration, not the only carrier of the value.
export function DistributionBars({ title, rows, total }: { title: string; rows: { label: string; count: number }[]; total: number }) {
  const sorted = [...rows].sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-lg border border-primary-100 bg-white p-4">
      <h3 className="text-sm font-semibold text-primary-700">{title}</h3>
      <ul className="mt-3 flex flex-col gap-2.5">
        {sorted.map((row) => {
          const percent = total === 0 ? 0 : Math.round((row.count / total) * 100);
          return (
            <li key={row.label}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-primary-900">{row.label}</span>
                <span className="text-primary-900/70">
                  {row.count} ({percent}%)
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-primary-50" aria-hidden>
                <div className="h-2 rounded-full bg-primary-500" style={{ width: `${percent}%` }} />
              </div>
            </li>
          );
        })}
        {sorted.length === 0 && <li className="text-sm text-primary-900/50">لا توجد بيانات</li>}
      </ul>
    </div>
  );
}
