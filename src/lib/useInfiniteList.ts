import { useEffect } from 'react';
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

/**
 * Mesma lista, mas puxando todas as páginas até o fim.
 *
 * Para coleções pequenas e fechadas (planos, métodos de pagamento, histórico
 * de assinaturas) em que a tela precisa do conjunto inteiro para montar
 * seletores e derivar estado — a paginação delas é feita no cliente.
 */
export function useFullList<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
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

export type { PaginatedResponse };
