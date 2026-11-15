import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import type { PaginatedResponse, PaginatedMeta } from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { useInfiniteList } from '@/src/lib/useInfiniteList';
import type {
  CreateCrmPayload,
  CreateStepPayload,
  Step,
  UpdateCrmPayload,
  UpdateStepPayload,
} from '@/src/lib/types';

export function useCrmsInfiniteQuery(perPage = 10) {
  return useInfiniteList(
    queryKeys.crms.all,
    (page, size) => api.listCrms(page, size),
    perPage,
  );
}

export function useStepsInfiniteQuery(crmId: number, perPage = 5) {
  return useInfiniteList(
    queryKeys.crms.steps(crmId),
    (page, size) => api.listSteps(crmId, page, size),
    perPage,
  );
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

export function useStepsQuery(crmId: number, enabled = true) {
  return useInfiniteList(
    queryKeys.crms.steps(crmId),
    (page, size) => api.listSteps(crmId, page, size),
    100,
    enabled,
  );
}

/** Etapas de toda a empresa (ou de um CRM), achatadas, para dropdowns. */
export function useAllStepsQuery(crmId?: number) {
  return useQuery({
    queryKey: queryKeys.crms.stepsAll(crmId),
    queryFn: () => api.listStepsAll(crmId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReorderStepsMutation(crmId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => api.reorderSteps(crmId, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.crms.steps(crmId) });
      const previous = queryClient.getQueryData(queryKeys.crms.steps(crmId));
      // Escreve a ordem otimista paginada em todas as páginas do infinito
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Step>>>(
        queryKeys.crms.steps(crmId),
        (old) => {
          if (!old) return old;
          const flat = old.pages.flatMap((p) => p.data);
          const byId = new Map(flat.map((s) => [s.id, s]));
          const reordered = orderedIds
            .map((id) => byId.get(id))
            .filter((s): s is Step => Boolean(s));
          const perPage = old.pages[0]?.meta.per_page ?? flat.length;
          const pages: PaginatedResponse<Step>[] = [];
          for (let i = 0; i < reordered.length; i += perPage) {
            const slice = reordered.slice(i, i + perPage).map((s, idx) => ({
              ...s,
              position: i + idx,
            }));
            pages.push({
              data: slice,
              meta: {
                current_page: i / perPage + 1,
                per_page: perPage,
                total: reordered.length,
                last_page: Math.max(1, Math.ceil(reordered.length / perPage)),
                from: i + 1,
                to: i + slice.length,
              },
            });
          }
          if (pages.length === 0) {
            pages.push(old.pages[0]);
          }
          return { ...old, pages, pageParams: pages.map((_, i) => i + 1) };
        },
      );
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
