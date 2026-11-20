import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { useToast } from '@/src/components/common/Toast';
import type { CreateLeadPayload, Lead, UpdateLeadPayload } from '@/src/lib/types';

function asListResult<T>(items: T[]) {
  return {
    data: items,
    meta: {
      current_page: 1,
      per_page: items.length || 1,
      total: items.length,
      last_page: 1,
      from: items.length ? 1 : null,
      to: items.length ? items.length : null,
    },
  };
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
  _perPage = 10,
  crmId?: number,
  filterStepId?: number,
) {
  const effectiveStepId = stepId ?? filterStepId;
  const query = useQuery({
    queryKey: [...queryKeys.leads.byStep(effectiveStepId), 'all', search ?? '', crmId ?? 0] as const,
    queryFn: () => api.listLeads(effectiveStepId, search, crmId),
  });
  const items = query.data ?? [];
  return {
    ...query,
    data: { pages: [asListResult(items)], pageParams: [1] },
    items,
    meta: asListResult(items).meta,
    total: items.length,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: async () => query,
  };
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
    }: {
      leadId: number;
      stepId: number;
      previousId?: number | null;
      nextId?: number | null;
    }) => api.updateLeadStep(leadId, stepId, { previousId, nextId }),
    onError: (error) => {
      toast.error('Não foi possível mover o lead', getApiErrorMessage(error));
    },
    onSettled: (_data, _error, { leadId }) => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
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
    },
  });
}
