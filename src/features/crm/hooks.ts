import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  CreateCrmPayload,
  CreateStepPayload,
  UpdateCrmPayload,
  UpdateStepPayload,
} from '@/src/lib/types';

export function useCrmsQuery() {
  return useQuery({
    queryKey: queryKeys.crms.all,
    queryFn: api.listCrms,
  });
}

export function useCrmQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.crms.detail(id),
    queryFn: () => api.getCrm(id),
    enabled: Number.isFinite(id) && id > 0,
    retry: false,
  });
}

export function useCreateCrmMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCrmPayload) => api.createCrm(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crms.all });
    },
  });
}

export function useUpdateCrmMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCrmPayload }) =>
      api.updateCrm(id, payload),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crms.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crms.detail(id) });
    },
  });
}

export function useDeleteCrmMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteCrm(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crms.all });
    },
  });
}

export function useStepsQuery(crmId: number) {
  return useQuery({
    queryKey: queryKeys.crms.steps(crmId),
    queryFn: async () => {
      const steps = await api.listSteps(crmId);
      return [...steps].sort((a, b) => a.position - b.position);
    },
    enabled: Number.isFinite(crmId) && crmId > 0,
    retry: false,
  });
}

export function useCreateStepMutation(crmId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStepPayload) => api.createStep(crmId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crms.steps(crmId) });
    },
  });
}

export function useUpdateStepMutation(crmId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, payload }: { stepId: number; payload: UpdateStepPayload }) =>
      api.updateStep(stepId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crms.steps(crmId) });
    },
  });
}

export function useDeleteStepMutation(crmId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: number) => api.deleteStep(stepId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crms.steps(crmId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}
