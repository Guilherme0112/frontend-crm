import type { ReactNode } from 'react';
import { cn } from '@/src/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-950/[0.14] bg-white/50 px-6 py-14 text-center dark:border-white/[0.1] dark:bg-white/[0.02]',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-950/[0.07] bg-white text-zinc-500 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
