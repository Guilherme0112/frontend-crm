import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { invalidateDashboards } from '@/src/lib/invalidateDashboards';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { useToast } from '@/src/components/common/Toast';
import type { CreateLeadPayload, Lead, UpdateLeadPayload } from '@/src/lib/types';

/**
 * O total por etapa (`leads_value_total_cents`) é servido pelo endpoint de etapas,
 * não pelo de leads. Sem invalidar `['crms', *, 'steps']`, o cabeçalho da coluna
 * segue mostrando o total antigo depois de criar, editar, mover ou excluir lead.
 */
function invalidateStepTotals(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === 'crms' && query.queryKey[2] === 'steps',
  });
}

/**
 * Tudo que muda lead muda a página inicial: a fila "sem próximo passo", as
 * faixas de tempo na etapa e o funil saem dos mesmos registros.
 */
function invalidateAfterLeadChange(queryClient: QueryClient) {
  invalidateStepTotals(queryClient);
  invalidateDashboards(queryClient);
}

export function useLeadSourceQuery(id: number | null) {
  return useQuery({
    queryKey: ['leads', id, 'source'] as const,
    queryFn: () => api.getLeadSource(id as number),
    enabled: Boolean(id && id > 0),
    retry: false,
  });
}

export function useLeadsInfiniteQuery(
  stepId: number | undefined,
  search?: string,
  perPage = 15,
  crmId?: number,
  filterStepId?: number,
  enabled = true,
) {
  const effectiveStepId = stepId ?? filterStepId;
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<Lead[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, per_page: perPage, total: 0, last_page: 1, from: null as number | null, to: null as number | null });
  const key = JSON.stringify([effectiveStepId, search ?? '', crmId ?? 0, perPage, enabled]);

  useEffect(() => {
    setPage(1);
    setAllItems([]);
    setMeta({ current_page: 1, per_page: perPage, total: 0, last_page: 1, from: null, to: null });
  }, [key, perPage]);

  const query = useQuery({
    queryKey: [...queryKeys.leads.byStep(effectiveStepId), 'infinite', page, perPage, search ?? '', crmId ?? 0] as const,
    queryFn: () => api.listLeadsPaginated(effectiveStepId, search, crmId, page, perPage),
    enabled,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!query.data) return;
    setMeta(query.data.meta);
    setAllItems((prev) => page === 1 ? query.data!.data : [...prev.filter(i => !query.data!.data.some(n => n.id === i.id)), ...query.data!.data]);
  }, [query.data, page]);

  const hasNextPage = meta.current_page < meta.last_page;
  return {
    ...query,
    items: allItems,
    meta,
    total: meta.total,
    hasNextPage,
    isFetchingNextPage: query.isFetching && page > 1,
    fetchNextPage: async () => { if (hasNextPage && !query.isFetching) setPage((p) => p + 1); },
  };
}

export function useLeadsPaginatedQuery(
  stepId: number | undefined,
  search?: string,
  perPage = 15,
  crmId?: number,
  enabled = true,
  page = 1,
) {
  const query = useQuery({
    queryKey: [...queryKeys.leads.byStep(stepId), 'paginated', page, perPage, search ?? '', crmId ?? 0] as const,
    queryFn: () => api.listLeadsPaginated(stepId, search, crmId, page, perPage),
    enabled,
    placeholderData: (prev) => prev,
  });
  const items = query.data?.data ?? [];
  const meta = query.data?.meta ?? { current_page: page, per_page: perPage, total: 0, last_page: 1, from: null, to: null };
  return { ...query, items, meta, total: meta.total };
}

export function useLeadQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id ?? 0),
    queryFn: () => api.getLead(id as number),
    enabled: Boolean(id && id > 0),
    retry: false,
  });
}

export function useLeadHistoryQuery(id: number | null, limit = 100) {
  return useQuery({
    queryKey: queryKeys.leads.history(id ?? 0),
    queryFn: () => api.getLeadHistory(id as number, limit),
    enabled: Boolean(id && id > 0),
    retry: false,
  });
}

export function useCreateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => api.createLead(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      invalidateAfterLeadChange(queryClient);
    },
  });
}

export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteLead(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.leads.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      invalidateAfterLeadChange(queryClient);
    },
  });
}

export function useMoveLeadStepMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      leadId,
      stepId,
      previousId,
      nextId,
      lostReasonId,
    }: {
      leadId: number;
      stepId: number;
      previousId?: number | null;
      nextId?: number | null;
      /** Só na ida para uma etapa de perda; nas demais fica ausente. */
      lostReasonId?: number | null;
    }) => api.updateLeadStep(leadId, stepId, { previousId, nextId, lostReasonId }),
    onError: (error) => {
      toast.error('Não foi possível mover o lead', getApiErrorMessage(error));
    },
    onSettled: (_data, _error, { leadId }) => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      invalidateAfterLeadChange(queryClient);
    },
  });
}

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateLeadPayload }) =>
      api.updateLead(id, payload),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(queryKeys.leads.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      void queryClient.invalidateQueries({ queryKey: ['leads', id, 'source'] });
      invalidateAfterLeadChange(queryClient);
    },
  });
}
