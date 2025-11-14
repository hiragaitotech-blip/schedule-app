export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-3/4 rounded bg-slate-200"></div>
      <div className="h-4 w-1/2 rounded bg-slate-200"></div>
      <div className="h-4 w-5/6 rounded bg-slate-200"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-10 w-full rounded bg-slate-200"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full rounded bg-slate-100"></div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="h-6 w-1/3 rounded bg-slate-200"></div>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full rounded bg-slate-100"></div>
        <div className="h-4 w-5/6 rounded bg-slate-100"></div>
        <div className="h-4 w-4/6 rounded bg-slate-100"></div>
      </div>
    </div>
  );
}

