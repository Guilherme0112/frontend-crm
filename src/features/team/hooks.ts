import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateUserPayload, UpdateUserPayload } from '@/src/lib/types';

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: api.listUsers,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => api.createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      api.updateUser(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
