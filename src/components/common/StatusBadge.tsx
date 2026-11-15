import { AlertCircle, CheckCircle2, Clock, MinusCircle } from 'lucide-react';
import { cn } from '@/src/lib/cn';

type SemanticTone = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusIndicatorProps {
  tone: SemanticTone;
  label: string;
  className?: string;
}

const TONE_CLASSES: Record<SemanticTone, string> = {
  success: 'text-emerald-700 dark:text-emerald-400',
  warning: 'text-amber-700 dark:text-amber-400',
  danger: 'text-red-700 dark:text-red-400',
  neutral: 'text-zinc-600 dark:text-zinc-400',
};

export function StatusIndicator({ tone, label, className }: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {tone === 'success' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
      {tone === 'warning' && <Clock className="h-3.5 w-3.5 shrink-0" />}
      {tone === 'danger' && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      {tone === 'neutral' && <MinusCircle className="h-3.5 w-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  );
}

export function getInvoiceStatusMeta(status: 'open' | 'paid' | 'void'): {
  tone: SemanticTone;
  label: string;
} {
  switch (status) {
    case 'paid':
      return { tone: 'success', label: 'Paga' };
    case 'open':
      return { tone: 'warning', label: 'Em aberto' };
    case 'void':
      return { tone: 'neutral', label: 'Cancelada' };
  }
}

export function getSubscriptionStatusMeta(
  status: string,
): { tone: SemanticTone; label: string } {
  switch (status) {
    case 'active':
      return { tone: 'success', label: 'Ativa' };
    case 'trialing':
      return { tone: 'warning', label: 'Em teste' };
    case 'past_due':
      return { tone: 'danger', label: 'Pagamento pendente' };
    case 'canceled':
      return { tone: 'neutral', label: 'Cancelada' };
    default:
      return { tone: 'neutral', label: status || 'Desconhecida' };
  }
}
