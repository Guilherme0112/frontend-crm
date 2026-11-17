import IconButton from '@mui/material/IconButton';
import type { ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const SIZE_MAP = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
  '2xl': 'xl',
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={SIZE_MAP[size]}
      fullWidth
      aria-labelledby="modal-title"
      slotProps={{ paper: { sx: { maxHeight: '90vh' } } }}
    >
      <DialogTitle id="modal-title" sx={{ pb: description ? 1 : 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Typography
              component="h2"
              sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}
            >
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {description}
              </Typography>
            )}
          </div>

          <IconButton onClick={onClose} size="small" aria-label="Fechar janela" sx={{ mt: -0.5 }}>
            <X className="h-4 w-4" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
