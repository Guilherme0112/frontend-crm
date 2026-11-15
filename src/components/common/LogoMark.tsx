import { cn } from '@/src/lib/cn';

export function LogoMark({ className, invert = false }: { className?: string; invert?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center rounded-[10px] shadow-sm ring-1 ring-inset',
        invert
          ? 'bg-zinc-100 text-zinc-900 ring-white/20'
          : 'bg-zinc-900 text-white ring-white/10 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-black/10',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[55%] w-[55%]"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 5l7 14 7-14" />
      </svg>
    </span>
  );
}
