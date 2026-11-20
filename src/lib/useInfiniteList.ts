import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

export interface PaginatedMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

function normalizePage<T>(result: T[] | PaginatedResponse<T> | null | undefined, page = 1): PaginatedResponse<T> {
  if (Array.isArray(result)) {
    const items = result;
    return {
      data: items,
      meta: {
        current_page: page,
        per_page: items.length || 1,
        total: items.length,
        last_page: 1,
        from: items.length ? 1 : null,
        to: items.length ? items.length : null,
      },
    };
  }

  if (result && typeof result === 'object' && Array.isArray((result as PaginatedResponse<T>).data)) {
    return result as PaginatedResponse<T>;
  }

  // Defensive fallback for unexpected API shapes (e.g. undefined/null during refactors)
  return {
    data: [],
    meta: {
      current_page: page,
      per_page: 1,
      total: 0,
      last_page: 1,
      from: null,
      to: null,
    },
  };
}

export function useInfiniteList<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number, perPage: number) => Promise<T[] | PaginatedResponse<T>>,
  perPage = 25,
  enabled = true,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) =>
      normalizePage(await fetchPage(pageParam as number, perPage), pageParam as number),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
  });

  const pages = (query.data?.pages ?? []).map((p) => normalizePage<T>(p as any));
  const items = pages.flatMap((page) => page.data ?? []);
  const meta = pages.at(-1)?.meta ?? null;

  return {
    ...query,
    items,
    meta,
    total: meta?.total ?? items.length,
  };
}

export function useFullList<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number, perPage: number) => Promise<T[] | PaginatedResponse<T>>,
  perPage = 100,
  enabled = true,
) {
  const list = useInfiniteList(queryKey, fetchPage, perPage, enabled);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return list;
}
