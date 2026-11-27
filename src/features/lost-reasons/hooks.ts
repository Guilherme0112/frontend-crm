import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { invalidateDashboards } from '@/src/lib/invalidateDashboards';

export function useLostReasonsQuery(onlyActive = false) {
  return useQuery({
    queryKey: queryKeys.lostReasons.list(onlyActive),
    queryFn: () => api.listLostReasons(onlyActive),
  });
}

export function useCreateLostReasonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string }) => api.createLostReason(payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateLostReasonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name?: string; is_active?: boolean } }) =>
      api.updateLostReason(id, payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeleteLostReasonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteLostReason(id),
    onSuccess: () => invalidate(queryClient),
  });
}

/**
 * Renomear ou desativar um motivo muda o rótulo do gráfico "Motivos de perda"
 * do funil, então a invalidação precisa alcançar os dashboards — senão o
 * usuário renomeia e o gráfico continua mostrando o nome antigo.
 */
function invalidate(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.lostReasons.all });
  invalidateDashboards(queryClient);
}
