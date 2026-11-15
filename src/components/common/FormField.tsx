import type { ReactNode } from 'react';
import { cn } from '@/src/lib/cn';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClassName = (hasError?: boolean) =>
  cn(
    'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-shadow focus:outline-none focus:ring-2 dark:bg-[#101012] dark:text-zinc-100 dark:placeholder:text-zinc-600',
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-800'
      : 'border-zinc-950/[0.12] focus:border-zinc-900 focus:ring-zinc-900/10 dark:border-white/[0.12] dark:focus:border-zinc-400 dark:focus:ring-white/10',
  );
