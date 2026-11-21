import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateWhatsappSenderInput, UpdateWhatsappSenderInput } from '@/src/lib/types';

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

export function useWhatsappSendersQuery(_page = 1, _perPage = 10, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.whatsappSenders.all,
    queryFn: () => api.listWhatsappSenders(),
    enabled,
  });
  return {
    ...query,
    data: query.data ? asListResult(query.data) : undefined,
  };
}

export function useWhatsappSendersInfiniteQuery(_perPage = 25, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.whatsappSenders.all,
    queryFn: () => api.listWhatsappSenders(),
    enabled,
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

export function useCreateWhatsappSenderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWhatsappSenderInput) => api.createWhatsappSender(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappSenders.all });
    },
  });
}

export function useUpdateWhatsappSenderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWhatsappSenderInput }) =>
      api.updateWhatsappSender(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappSenders.all });
    },
  });
}

export function useDeleteWhatsappSenderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteWhatsappSender(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappSenders.all });
    },
  });
}
