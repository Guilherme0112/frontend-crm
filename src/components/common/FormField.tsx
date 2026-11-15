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
        className="block text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
        {required && <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
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
    'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500',
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500'
      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-700 dark:focus:border-blue-500',
  );
