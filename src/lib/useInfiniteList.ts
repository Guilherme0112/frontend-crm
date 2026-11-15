import { useInfiniteQuery } from '@tanstack/react-query';
import * as api from './api';
import type { PaginatedResponse } from './api';

/**
 * Consome uma lista paginada em formato { data: [...], meta: {...} }
 * e expõe páginas achatadas + meta do último lote carregado.
 */
export function useInfiniteList<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
  perPage = 25,
  enabled = true,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetchPage(pageParam as number, perPage),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
  });

  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const meta = query.data?.pages.at(-1)?.meta ?? null;

  return {
    ...query,
    items,
    meta,
    total: meta?.total ?? items.length,
  };
}

export type { PaginatedResponse };
