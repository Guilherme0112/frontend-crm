import type { ReactNode } from 'react';
import Button from '@mui/material/Button';
import ActionButton from './Button';

interface ModalActionsProps {
  onCancel: () => void;
  submitLabel: ReactNode;
  isPending?: boolean;
  disabled?: boolean;
  cancelLabel?: string;
  pendingLabel?: string;
  /** Ação secundária opcional exibida à esquerda do rodapé (ex.: limpar filtros). */
  extraAction?: ReactNode;
}

/** Rodapé padrão das modais: cancelar secundário + ação principal azul. */
export function ModalActions({
  onCancel,
  submitLabel,
  isPending = false,
  disabled = false,
  cancelLabel = 'Cancelar',
  pendingLabel = 'Salvando...',
  extraAction,
}: ModalActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
      {extraAction ?? <span />}
      <div className="flex gap-3">
        <Button type="button" variant="outlined" color="inherit" onClick={onCancel} disabled={isPending}>
          {cancelLabel}
        </Button>
        <ActionButton type="submit" disabled={isPending || disabled}>
          {isPending ? pendingLabel : submitLabel}
        </ActionButton>
      </div>
    </div>
  );
}
