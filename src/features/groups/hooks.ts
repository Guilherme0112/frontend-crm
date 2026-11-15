import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateGroupPayload, UpdateGroupPayload } from '@/src/lib/types';

const GROUPS_PER_PAGE = 10;

export function useGroupsQuery(page = 1, perPage = GROUPS_PER_PAGE) {
  return useQuery({
    queryKey: queryKeys.groups.list(page, perPage),
    queryFn: () => api.listGroups(page, perPage),
    placeholderData: keepPreviousData,
  });
}

export function useGroupQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => api.getGroup(id),
    enabled: Number.isFinite(id) && id > 0,
    retry: false,
  });
}

export function useGroupLeadsQuery(groupId: number) {
  return useQuery({
    queryKey: queryKeys.groups.leads(groupId),
    queryFn: () => api.getGroupLeads(groupId),
    enabled: Number.isFinite(groupId) && groupId > 0,
    retry: false,
  });
}

export function useSyncGroupLeadsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, leadIds }: { id: number; leadIds: number[] }) =>
      api.syncGroupLeads(id, leadIds),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.leads(id) });
    },
  });
}

export function useSendGroupEmailsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.sendGroupEmails(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.sends(id) });
    },
  });
}

export function useGroupSendsQuery(groupId: number, page = 1, perPage = 10) {
  return useQuery({
    queryKey: queryKeys.groups.sendsList(groupId, page, perPage),
    queryFn: () => api.listGroupSends(groupId, page, perPage),
    enabled: Number.isFinite(groupId) && groupId > 0,
    // While any send is processing, poll until it settles to completed/completed_with_errors.
    refetchInterval: (query) =>
      query.state.data?.items.some((send) => send.status === 'processing') ? 3000 : false,
  });
}

export function useGroupSendRecipientsQuery(
  groupId: number,
  sendId: number | null,
  page = 1,
  perPage = 25,
) {
  return useQuery({
    queryKey:
      sendId !== null
        ? queryKeys.groups.recipients(groupId, sendId, page, perPage)
        : ['groups', groupId, 'sends', 'recipients', 'disabled'],
    queryFn: () => api.listGroupSendRecipients(groupId, sendId as number, page, perPage),
    enabled: Number.isFinite(groupId) && groupId > 0 && sendId !== null,
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
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id) });
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
