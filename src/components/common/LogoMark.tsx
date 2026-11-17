import { cn } from '@/src/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/saldup-crm-logo.svg"
      alt="SaldUp CRM"
      className={cn('block h-8 w-auto', className)}
    />
  );
}
