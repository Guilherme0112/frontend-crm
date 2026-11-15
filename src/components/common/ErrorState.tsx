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
      className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-white px-6 py-10 text-center dark:border-red-900/60 dark:bg-slate-900"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-400">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {message}
      </p>
      {(onRetry || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
