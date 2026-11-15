import { cn } from '@/src/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80',
        className,
      )}
    />
  );
}

export function TableRowsSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="grid gap-4 px-5 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, cIdx) => (
            <Skeleton key={cIdx} className="h-4 w-full max-w-[180px]" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
