import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { X } from 'lucide-react';
import { TableActionButton } from './TableActionButton';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, children }: DrawerProps) {
  return (
    <MuiDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      aria-labelledby="drawer-title"
      slotProps={{ paper: { sx: { width: '100%', maxWidth: { xs: '100%', sm: 576 } } } }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            id="drawer-title"
            component="h2"
            noWrap
            sx={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <TableActionButton onClick={onClose} aria-label="Fechar painel" className="shrink-0">
          <X className="h-5 w-5" />
        </TableActionButton>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: 2.5 }}>{children}</Box>
    </MuiDrawer>
  );
}
