import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { useToast } from '@/src/components/common/Toast';
import type { CreateLeadPayload, Lead, UpdateLeadPayload } from '@/src/lib/types';

export function useLeadsQuery(stepId?: number) {
  return useQuery({
    queryKey: queryKeys.leads.byStep(stepId),
    queryFn: () => api.listLeads(stepId),
  });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteLead(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.leads.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useMoveLeadStepMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ leadId, stepId }: { leadId: number; stepId: number }) =>
      api.updateLeadStep(leadId, stepId),
    onMutate: async ({ leadId, stepId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.all });

      const previousLeads = queryClient.getQueryData<Lead[]>(queryKeys.leads.all);
      const previousDetail = queryClient.getQueryData<Lead>(queryKeys.leads.detail(leadId));

      if (previousLeads) {
        queryClient.setQueryData<Lead[]>(
          queryKeys.leads.all,
          previousLeads.map((lead) =>
            lead.id === leadId ? { ...lead, step_id: stepId } : lead,
          ),
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<Lead>(queryKeys.leads.detail(leadId), {
          ...previousDetail,
          step_id: stepId,
        });
      }

      return { previousLeads, previousDetail };
    },
    onError: (error, { leadId }, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKeys.leads.all, context.previousLeads);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.leads.detail(leadId), context.previousDetail);
      }
      toast.error('Não foi possível mover o lead', getApiErrorMessage(error));
    },
    onSettled: (_data, _error, { leadId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
    },
  });
}
