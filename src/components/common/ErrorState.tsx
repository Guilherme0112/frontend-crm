import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Stack from '@mui/material/Stack';
import { RefreshCw } from 'lucide-react';
import { getApiErrorMessage } from '@/src/lib/formErrors';

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorState({
  title = 'Erro ao carregar dados',
  error,
  onRetry,
  secondaryAction,
}: ErrorStateProps) {
  const message = getApiErrorMessage(error);

  return (
    <Alert severity="error" variant="outlined" sx={{ borderRadius: 2, px: 3, py: 2 }}>
      <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>

      {message}

      {(onRetry || secondaryAction) && (
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
          {onRetry && (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshCw className="h-4 w-4" />}
            >
              Tentar novamente
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Stack>
      )}
    </Alert>
  );
}
