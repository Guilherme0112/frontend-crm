import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end', pt: 0.5 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </Button>

          <Button
            variant="contained"
            color={variant === 'danger' ? 'error' : 'primary'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Processando...' : confirmLabel}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
