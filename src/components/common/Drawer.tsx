import IconButton from '@mui/material/IconButton';
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { X } from 'lucide-react';

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
      slotProps={{ paper: { sx: { width: '100%', maxWidth: 576 } } }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          px: 3,
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

        <IconButton onClick={onClose} size="small" aria-label="Fechar painel">
          <X className="h-5 w-5" />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>{children}</Box>
    </MuiDrawer>
  );
}
