import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateGroupPayload, UpdateGroupPayload } from '@/src/lib/types';

export function useGroupsQuery() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: api.listGroups,
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => api.createGroup(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateGroupPayload }) =>
      api.updateGroup(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}
