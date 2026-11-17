import Chip from '@mui/material/Chip';
import { AlertCircle, CheckCircle2, Clock, MinusCircle } from 'lucide-react';

type SemanticTone = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusIndicatorProps {
  tone: SemanticTone;
  label: string;
  className?: string;
}

const TONE_COLOR = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  neutral: 'default',
} as const;

const TONE_ICON = {
  success: CheckCircle2,
  warning: Clock,
  danger: AlertCircle,
  neutral: MinusCircle,
};

export function StatusIndicator({ tone, label, className }: StatusIndicatorProps) {
  const Icon = TONE_ICON[tone] ?? MinusCircle;

  return (
    <Chip
      size="small"
      variant="outlined"
      color={TONE_COLOR[tone] ?? 'default'}
      className={className}
      icon={<Icon className="h-3.5 w-3.5" />}
      label={label}
      sx={{ fontSize: 12, '& .MuiChip-icon': { ml: 0.75 } }}
    />
  );
}

export function getInvoiceStatusMeta(status: string): {
  tone: SemanticTone;
  label: string;
} {
  switch (status) {
    case 'paid':
      return { tone: 'success', label: 'Paga' };
    case 'open':
      return { tone: 'warning', label: 'Em aberto' };
    case 'overdue':
      return { tone: 'danger', label: 'Vencida' };
    case 'void':
      return { tone: 'neutral', label: 'Cancelada' };
    default:
      return { tone: 'neutral', label: status || 'Desconhecida' };
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
    case 'pending':
      return { tone: 'warning', label: 'Aguardando pagamento' };
    case 'past_due':
      return { tone: 'danger', label: 'Pagamento pendente' };
    case 'canceled':
      return { tone: 'neutral', label: 'Cancelada' };
    default:
      return { tone: 'neutral', label: status || 'Desconhecida' };
  }
}
