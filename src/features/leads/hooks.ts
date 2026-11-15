import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { useInfiniteList } from '@/src/lib/useInfiniteList';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { useToast } from '@/src/components/common/Toast';
import type { CreateLeadPayload, Lead, UpdateLeadPayload } from '@/src/lib/types';

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
  perPage = 10,
  crmId?: number,
  filterStepId?: number,
) {
  const effectiveStepId = stepId ?? filterStepId;

  return useInfiniteList(
    [...queryKeys.leads.byStep(effectiveStepId), 'infinite', search ?? '', crmId ?? 0] as const,
    (page, size) => api.listLeads(effectiveStepId, page, size, search, crmId),
    perPage,
  );
}

export function useLeadQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id ?? 0),
    queryFn: () => api.getLead(id as number),
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
