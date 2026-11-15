import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { useInfiniteList } from '@/src/lib/useInfiniteList';
import type { CreateEmailConfigInput, UpdateEmailConfigInput } from '@/src/lib/types';

export function useEmailConfigsInfiniteQuery(perPage = 25, enabled = true) {
  return useInfiniteList(
    queryKeys.emailConfigs.all,
    (page, size) => api.listEmailConfigs(page, size),
    perPage,
    enabled,
  );
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
      // Deleting a config nullifies email_config_id on linked groups (FK nullOnDelete)
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}
