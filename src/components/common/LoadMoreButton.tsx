import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { PlusCircle } from 'lucide-react';

interface LoadMoreButtonProps {
  total?: number;
  loaded?: number;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  label?: string;
  className?: string;
}

export function LoadMoreButton({
  total,
  loaded,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  label = 'Carregar mais',
  className,
}: LoadMoreButtonProps) {
  if (!hasNextPage) return null;

  const counter = total !== undefined && loaded !== undefined ? `${loaded} de ${total}` : undefined;

  return (
    <Button
      fullWidth
      variant="outlined"
      color="inherit"
      onClick={onLoadMore}
      disabled={isFetchingNextPage}
      className={className}
      startIcon={
        isFetchingNextPage ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <PlusCircle className="h-4 w-4" />
        )
      }
      sx={{
        borderStyle: 'dashed',
        borderRadius: 3,
        py: 1.25,
        fontSize: 12,
        fontWeight: 600,
        color: 'text.secondary',
      }}
    >
      {isFetchingNextPage ? 'Carregando...' : label}
      {counter && ` · ${counter}`}
    </Button>
  );
}
