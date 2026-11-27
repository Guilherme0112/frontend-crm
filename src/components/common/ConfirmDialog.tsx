import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ActionButton from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isPending?: boolean;
  errorMessage?: string | null;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isPending = false,
  errorMessage,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {description}
        </Typography>

        {errorMessage && (
          <Alert severity="error" variant="outlined">
            {errorMessage}
          </Alert>
        )}

        {/* O Modal vira fullScreen abaixo de sm. Lado a lado, rótulos longos
            ("Confirmar cancelamento") espremem os dois botões; no celular eles
            empilham em largura cheia, como o rodapé dos modais de disparo. */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'flex-end', pt: 0.5 }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            disabled={isPending}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {cancelLabel}
          </Button>

          <ActionButton
            color={variant === 'danger' ? 'error' : undefined}
            onClick={onConfirm}
            disabled={isPending}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {isPending ? 'Processando...' : confirmLabel}
          </ActionButton>
        </Stack>
      </Stack>
    </Modal>
  );
}
