import { Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/src/lib/cn';

interface LoadMoreButtonProps {
  total?: number;
  loaded?: number;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  label?: string;
  className?: string;
}

export function LoadMoreButton({
  total,
  loaded,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  label = 'Carregar mais',
  className,
}: LoadMoreButtonProps) {
  if (!hasNextPage) return null;

  const counter = total !== undefined && loaded !== undefined ? `${loaded} de ${total}` : undefined;

  return (
    <button
      type="button"
      onClick={onLoadMore}
      disabled={isFetchingNextPage}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-950/[0.15] px-4 py-2.5 text-xs font-semibold text-zinc-500 transition-colors hover:border-zinc-950/[0.3] hover:bg-zinc-950/[0.03] hover:text-zinc-800 disabled:opacity-60 dark:border-white/[0.15] dark:text-zinc-400 dark:hover:border-white/[0.25] dark:hover:bg-white/[0.04] dark:hover:text-zinc-100',
        className,
      )}
    >
      {isFetchingNextPage ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <PlusCircle className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isFetchingNextPage ? 'Carregando...' : label}</span>
      {counter && <span className="font-mono tabular-nums text-zinc-400 dark:text-zinc-500">· {counter}</span>}
    </button>
  );
}
