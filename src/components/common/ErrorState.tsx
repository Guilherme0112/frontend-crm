import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getApiErrorMessage } from '@/src/lib/formErrors';

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorState({
  title = 'Erro ao carregar dados',
  error,
  onRetry,
  secondaryAction,
}: ErrorStateProps) {
  const message = getApiErrorMessage(error);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-red-200/80 bg-white px-6 py-12 text-center dark:border-red-900/50 dark:bg-white/[0.02]"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-400">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        {message}
      </p>
      {(onRetry || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center rounded-lg border border-zinc-950/[0.12] bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
