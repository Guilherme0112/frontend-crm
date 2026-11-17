import MuiPagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface PaginationProps {
  page: number;
  lastPage: number;
  total: number;
  from: number | null;
  to: number | null;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
}

export function Pagination({
  page,
  lastPage,
  total,
  from,
  to,
  onPageChange,
  ariaLabel = 'Paginação',
}: PaginationProps) {
  if (total === 0) return null;

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        py: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {from ?? 0}–{to ?? 0} de {total}
      </Typography>

      {lastPage > 1 && (
        <MuiPagination
          page={page}
          count={lastPage}
          onChange={(_, value) => onPageChange(value)}
          size="small"
          shape="rounded"
          color="primary"
          siblingCount={1}
          getItemAriaLabel={(type, value) =>
            type === 'page' ? `Página ${value}` : type === 'previous' ? 'Página anterior' : 'Próxima página'
          }
          aria-label={ariaLabel}
        />
      )}
    </Stack>
  );
}
