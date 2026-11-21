import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateGroupPayload, UpdateGroupPayload } from '@/src/lib/types';
import type { WhatsappDispatchLogFilters } from '@/src/lib/api';

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

export function useGroupsQuery(_page = 1, _perPage = 10) {
  const query = useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: () => api.listGroups(),
  });
  return {
    ...query,
    data: query.data ? asListResult(query.data) : undefined,
  };
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

export function useGroupLeadIdsQuery(groupId: number) {
  return useQuery({
    queryKey: queryKeys.groups.leadIds(groupId),
    queryFn: () => api.getGroupLeadIds(groupId),
    enabled: Number.isFinite(groupId) && groupId > 0,
    retry: false,
  });
}

export function useGroupLeadsPaginatedQuery(groupId: number, page: number, perPage: number, search: string) {
  return useQuery({
    queryKey: queryKeys.groups.leadsPaginated(groupId, page, perPage, search),
    queryFn: () => api.listGroupLeadsPaginated(groupId, page, perPage, search),
    enabled: Number.isFinite(groupId) && groupId > 0,
    placeholderData: keepPreviousData,
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.leadIds(id) });
    },
  });
}

export function useSendGroupEmailsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      templateId,
      emailConfigId,
    }: {
      groupId: number;
      templateId: number;
      emailConfigId: number;
    }) => api.sendGroupEmails(groupId, { template_id: templateId, email_config_id: emailConfigId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useSendGroupWhatsappMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number;
      payload:
        | { provider?: 'official'; whatsapp_sender_id: number; whatsapp_template_id: number }
        | { provider: 'unofficial'; whatsapp_unofficial_instance_id: number; whatsapp_unofficial_template_id: number };
    }) => api.sendGroupWhatsapp(groupId, payload),
    onSuccess: (_, { groupId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappDispatchLogs.all });
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-dispatch-logs', 'group', groupId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialDispatchLogs.all });
    },
  });
}

export function useWhatsappDispatchLogsQuery(filters: WhatsappDispatchLogFilters, page = 1, perPage = 15, enabled = true) {
  const normalized = {
    group_id: filters.group_id ?? null,
    lead_id: filters.lead_id ?? null,
    status: filters.status ?? null,
    page,
    perPage,
  };

  return useQuery({
    queryKey: queryKeys.whatsappDispatchLogs.list(normalized),
    queryFn: () => api.listWhatsappDispatchLogs({ ...filters, page, per_page: perPage }),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 7000,
  });
}

export function useWhatsappUnofficialDispatchLogsQuery(
  filters: { group_id?: number; lead_id?: number; status?: string; instance_id?: number },
  page = 1,
  perPage = 15,
  enabled = true,
) {
  const normalized = {
    group_id: filters.group_id ?? null,
    lead_id: filters.lead_id ?? null,
    status: filters.status ?? null,
    instance_id: filters.instance_id ?? null,
    page,
    perPage,
  };

  return useQuery({
    queryKey: queryKeys.whatsappUnofficialDispatchLogs.list(normalized),
    queryFn: () => api.listWhatsappUnofficialDispatchLogs({ ...filters, page, per_page: perPage }),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 7000,
  });
}

export function useGroupSendsQuery(groupId: number, page = 1, perPage = 10, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.sendsList(groupId, page, perPage),
    queryFn: () => api.listGroupSends(groupId, page, perPage),
    enabled: enabled && Number.isFinite(groupId) && groupId > 0,
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
