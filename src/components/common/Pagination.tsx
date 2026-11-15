import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/cn';

interface PaginationProps {
  page: number;
  lastPage: number;
  total: number;
  from: number | null;
  to: number | null;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
}

function buildPageList(page: number, lastPage: number): Array<number | 'ellipsis'> {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(lastPage - 1, page + 1);

  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < lastPage - 1) pages.push('ellipsis');
  pages.push(lastPage);

  return pages;
}

/**
 * Paginação numerada padrão do app: "Anterior 1 … n … última Próximo",
 * com contador "Mostrando X–Y de Z" à esquerda.
 */
export function Pagination({
  page,
  lastPage,
  total,
  from,
  to,
  onPageChange,
  ariaLabel = 'Paginação',
}: PaginationProps) {
  if (lastPage <= 1 && total <= 0) return null;

  const pages = buildPageList(page, lastPage);
  const rangeStart = from ?? (total === 0 ? 0 : (page - 1) * 1 + 1);
  const rangeEnd = to ?? total;

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-wrap items-center justify-between gap-3 pt-2"
    >
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Mostrando{' '}
        <span className="font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
          {total === 0 ? 0 : rangeStart}–{rangeEnd}
        </span>{' '}
        de{' '}
        <span className="font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
          {total}
        </span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-950/[0.05] hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-35 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center text-xs font-semibold text-zinc-400 dark:text-zinc-500"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Página ${item}`}
              className={cn(
                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-semibold tabular-nums transition-colors',
                item === page
                  ? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-950/[0.05] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
          aria-label="Próxima página"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-950/[0.05] hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-35 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}
