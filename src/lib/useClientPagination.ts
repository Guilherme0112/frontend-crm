import { useEffect, useMemo, useState } from 'react';

interface ClientPage<T> {
  page: number;
  setPage: (page: number) => void;
  items: T[];
  lastPage: number;
  total: number;
  from: number | null;
  to: number | null;
}

/**
 * Pagina no cliente uma coleção já carregada por inteiro.
 *
 * Usado onde a tela precisa da lista completa para funcionar — seletores,
 * busca do método padrão, mapa de plano por id, assinatura ativa — mas quer
 * exibir só um pedaço por vez. Paginar no servidor nesses casos esconderia
 * registros da lógica, não só da tabela.
 */
export function useClientPagination<T>(all: T[], perPage = 10): ClientPage<T> {
  const [page, setPage] = useState(1);
  const total = all.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  // A lista encolhe quando um item é removido; não deixa a página órfã.
  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  const safePage = Math.min(page, lastPage);
  const start = (safePage - 1) * perPage;

  const items = useMemo(() => all.slice(start, start + perPage), [all, start, perPage]);

  return {
    page: safePage,
    setPage,
    items,
    lastPage,
    total,
    from: total === 0 ? null : start + 1,
    to: total === 0 ? null : Math.min(start + perPage, total),
  };
}
