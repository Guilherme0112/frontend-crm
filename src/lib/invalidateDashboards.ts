import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalida todos os dashboards.
 *
 * Os seis leem as mesmas tabelas que o CRM escreve, mas por caminho próprio —
 * nenhuma query de dashboard compartilha chave com `['leads']` ou `['agenda']`.
 * Sem esta invalidação, mover um lead ou fechar um compromisso deixava a página
 * inicial mostrando a fila antiga por até um minuto (o `staleTime`), e o usuário
 * concluía que a ação não tinha funcionado.
 *
 * Invalida o prefixo inteiro de propósito: as chaves carregam página, janela e
 * pipeline, então listar caso a caso garantiria esquecer um.
 */
export function invalidateDashboards(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === 'dashboards',
  });
}
