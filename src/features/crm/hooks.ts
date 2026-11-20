import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  CreateCrmPayload,
  CreateStepPayload,
  Step,
  UpdateCrmPayload,
  UpdateStepPayload,
} from '@/src/lib/types';

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

export function useCrmsInfiniteQuery() {
  const query = useQuery({
    queryKey: queryKeys.crms.all,
    queryFn: () => api.listCrms(),
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

export function useRegenerateCrmTokenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.regenerateCrmToken(id),
    onSuccess: (_, id) => {
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

export function useStepsInfiniteQuery(crmId: number) {
  const query = useQuery({
    queryKey: queryKeys.crms.steps(crmId),
    queryFn: () => api.listSteps(crmId),
    enabled: Number.isFinite(crmId) && crmId > 0,
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

export function useStepsQuery(crmId: number, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.crms.steps(crmId),
    queryFn: () => api.listSteps(crmId),
    enabled: enabled && Number.isFinite(crmId) && crmId > 0,
  });
  // Cache antigo da query infinita da tela de integração pode deixar um
  // objeto { pages, pageParams } nesta mesma chave; nunca tratá-lo como lista.
  const items = Array.isArray(query.data) ? query.data : [];
  return {
    ...query,
    items,
    data: query.data,
    meta: asListResult(items).meta,
    total: items.length,
  };
}

export function useAllStepsQuery(crmId?: number, search?: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.crms.stepsAll(crmId, search),
    queryFn: () => api.listStepsAll(crmId, search, limit),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useReorderStepsMutation(crmId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => api.reorderSteps(crmId, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.crms.steps(crmId) });
      const previous = queryClient.getQueryData<Step[]>(queryKeys.crms.steps(crmId));
      queryClient.setQueryData<Step[]>(queryKeys.crms.steps(crmId), (old) => {
        if (!old) return old;
        const byId = new Map(old.map((s) => [s.id, s]));
        return orderedIds
          .map((id, idx) => {
            const step = byId.get(id);
            return step ? { ...step, position: idx } : null;
          })
          .filter((s): s is Step => Boolean(s));
      });
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.crms.steps(crmId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crms.steps(crmId) });
    },
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
