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

/** Rodapé padrão das modais: cancelar secundário + ação principal com gradiente SaldUp. */
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
    <div className="flex flex-col gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07] sm:flex-row sm:items-center sm:justify-between">
      {extraAction ? <div className="w-full sm:w-auto [&>*]:w-full [&>*]:sm:w-auto">{extraAction}</div> : <span className="hidden sm:block" />}
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button type="button" variant="outlined" color="inherit" onClick={onCancel} disabled={isPending} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {cancelLabel}
        </Button>
        <ActionButton type="submit" disabled={isPending || disabled} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {isPending ? pendingLabel : submitLabel}
        </ActionButton>
      </div>
    </div>
  );
}
