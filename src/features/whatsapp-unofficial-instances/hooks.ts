import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateWhatsappUnofficialInstanceInput, UpdateWhatsappUnofficialInstanceInput } from '@/src/lib/types';

export function useWhatsappUnofficialInstancesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.whatsappUnofficialInstances.all,
    queryFn: () => api.listWhatsappUnofficialInstances(),
    enabled,
  });
}

export function useWhatsappUnofficialInstancesInfiniteQuery(_perPage = 25, enabled = true) {
  const query = useWhatsappUnofficialInstancesQuery(enabled);
  const items = query.data ?? [];
  return {
    ...query,
    items,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: async () => query,
  };
}

export function useCreateWhatsappUnofficialInstanceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWhatsappUnofficialInstanceInput) => api.createWhatsappUnofficialInstance(payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialInstances.all }); },
  });
}

export function useUpdateWhatsappUnofficialInstanceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWhatsappUnofficialInstanceInput }) =>
      api.updateWhatsappUnofficialInstance(id, payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialInstances.all }); },
  });
}

export function useDeleteWhatsappUnofficialInstanceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteWhatsappUnofficialInstance(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialInstances.all }); },
  });
}

export function useConnectWhatsappUnofficialInstanceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.connectWhatsappUnofficialInstance(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialInstances.all }); },
  });
}

export function useDisconnectWhatsappUnofficialInstanceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.disconnectWhatsappUnofficialInstance(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialInstances.all }); },
  });
}

export function useRefreshWhatsappUnofficialInstanceStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.getWhatsappUnofficialInstanceStatus(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialInstances.all }); },
  });
}
