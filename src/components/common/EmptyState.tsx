import type { ReactNode } from 'react';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Paper
      variant="outlined"
      className={className}
      sx={{
        borderRadius: 4,
        borderStyle: 'dashed',
        px: 3,
        py: 7,
        bgcolor: 'transparent',
      }}
    >
      <Stack spacing={0} sx={{ alignItems: 'center', textAlign: 'center' }}>
        {icon && (
          <Avatar
            variant="rounded"
            sx={{
              width: 44,
              height: 44,
              mb: 2,
              bgcolor: 'background.paper',
              color: 'text.secondary',
              border: 1,
              borderColor: 'divider',
            }}
          >
            {icon}
          </Avatar>
        )}

        <Typography
          component="h3"
          sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, maxWidth: 448 }}
        >
          {description}
        </Typography>

        {action && <div style={{ marginTop: 20 }}>{action}</div>}
      </Stack>
    </Paper>
  );
}
