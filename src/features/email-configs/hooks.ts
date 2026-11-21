import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateEmailConfigInput, UpdateEmailConfigInput } from '@/src/lib/types';

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

export function useEmailConfigsQuery(_page = 1, _perPage = 10, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.emailConfigs.all,
    queryFn: () => api.listEmailConfigs(),
    enabled,
  });
  return {
    ...query,
    data: query.data ? asListResult(query.data) : undefined,
  };
}

export function useEmailConfigsInfiniteQuery(_perPage = 25, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.emailConfigs.all,
    queryFn: () => api.listEmailConfigs(),
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

export function useCreateEmailConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmailConfigInput) => api.createEmailConfig(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.emailConfigs.all });
    },
  });
}

export function useUpdateEmailConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEmailConfigInput }) =>
      api.updateEmailConfig(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.emailConfigs.all });
    },
  });
}

export function useDeleteEmailConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteEmailConfig(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.emailConfigs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}
