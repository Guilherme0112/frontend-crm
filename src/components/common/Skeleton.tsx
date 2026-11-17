import MuiSkeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export function Skeleton({ className }: { className?: string }) {
  return <MuiSkeleton variant="rounded" className={className} sx={{ height: '100%' }} />;
}

export function TableRowsSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Stack spacing={0} sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Stack
          key={rowIndex}
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', py: 1.5 }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <MuiSkeleton
              key={colIndex}
              variant="rounded"
              height={14}
              sx={{ flex: colIndex === 0 ? 0.6 : 1 }}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

export function CardsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <MuiSkeleton key={index} variant="rounded" height={208} />
      ))}
    </div>
  );
}
