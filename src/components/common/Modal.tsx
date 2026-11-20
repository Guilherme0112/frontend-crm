import type { ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { X } from 'lucide-react';
import { TableActionButton } from './TableActionButton';

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
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={SIZE_MAP[size]}
      fullWidth
      fullScreen={fullScreen}
      aria-labelledby="modal-title"
      slotProps={{
        paper: {
          sx: {
            maxHeight: fullScreen ? '100%' : '90vh',
            m: fullScreen ? 0 : 2,
            width: fullScreen ? '100%' : undefined,
          },
        },
      }}
    >
      <DialogTitle
        id="modal-title"
        sx={{
          pb: description ? 1 : 2,
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0 }}>
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

          <TableActionButton onClick={onClose} aria-label="Fechar janela" className="-mt-0.5 shrink-0">
            <X className="h-4 w-4" />
          </TableActionButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
