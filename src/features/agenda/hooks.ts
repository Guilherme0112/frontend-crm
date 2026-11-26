import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { useToast } from '@/src/components/common/Toast';
import { useLeadsPaginatedQuery } from '@/src/features/leads/hooks';
import type {
  AgendaEventStatus,
  CreateAgendaEventPayload,
  Lead,
  ListAgendaEventsParams,
  UpdateAgendaEventPayload,
} from '@/src/lib/types';

function invalidateAgenda(queryClient: QueryClient, leadId?: number | null): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.agenda.all });
  if (leadId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.leads.history(leadId) });
  }
}

export function useAgendaEventsQuery(params: ListAgendaEventsParams) {
  return useQuery({
    queryKey: queryKeys.agenda.list(params),
    queryFn: () => api.listAgendaEvents(params),
  });
}

export function useAgendaEventQuery(id: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.agenda.detail(id ?? 0),
    queryFn: () => api.getAgendaEvent(id as number),
    enabled: enabled && Boolean(id && id > 0),
    retry: false,
  });
}

/**
 * Lookups são sob demanda: a grade busca apenas o dia selecionado (10 por página).
 * Users entram quando o seletor é aberto; leads entram paginados (página + busca no
 * servidor) no mesmo momento; config/templates entram quando o canal de lembrete é
 * escolhido. `enabled = false` mantém a chave em cache sem fetch.
 */
export function useAgendaUsersQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => api.listUsers(),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Busca paginada de leads para os autocompletes da agenda. Expõe `data` como
 * array (contrato antigo) e `meta` para quem precisar do total.
 */
export function useAgendaLeadsQuery(
  enabled = true,
  search?: string,
  page = 1,
  perPage = 20,
) {
  const query = useLeadsPaginatedQuery(
    undefined,
    search || undefined,
    perPage,
    undefined,
    enabled,
    page,
  );
  const [loaded, setLoaded] = useState<{ search?: string; items: Lead[] }>({
    search,
    items: [],
  });

  // "Carregar mais" troca a página, então acumulamos os itens já vistos para
  // que a lista do autocomplete não perca as páginas anteriores.
  useEffect(() => {
    const items = query.data?.data;
    if (!items?.length) return;

    setLoaded((current) => {
      const base = current.search === search ? current.items : [];
      const byId = new Map(base.map((lead) => [lead.id, lead]));

      for (const lead of items) {
        byId.set(lead.id, lead);
      }

      return { search, items: [...byId.values()] };
    });
  }, [query.data?.data, search]);

  return {
    ...query,
    data: loaded.search === search ? loaded.items : (query.data?.data ?? []),
    meta: query.meta,
  };
}

/** Configurações/templates usadas pelo formulário de lembrete. */
export function useAgendaEmailConfigsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.emailConfigs.all,
    queryFn: () => api.listEmailConfigs(),
    enabled,
    staleTime: 60_000,
  });
}

export function useAgendaSendingTemplatesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.templates.all,
    queryFn: () => api.listSendingTemplates(),
    enabled,
    staleTime: 60_000,
  });
}

export function useAgendaWhatsappSendersQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.whatsappSenders.all,
    queryFn: () => api.listWhatsappSenders(),
    enabled,
    staleTime: 60_000,
  });
}

export function useAgendaWhatsappTemplatesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.whatsappTemplates.all,
    queryFn: () => api.listWhatsappTemplates(),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateAgendaEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAgendaEventPayload) => api.createAgendaEvent(payload),
    onSuccess: (event) => invalidateAgenda(queryClient, event.lead_id),
  });
}

export function useUpdateAgendaEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateAgendaEventPayload;
      leadId?: number | null;
    }) => api.updateAgendaEvent(id, payload),
    onSuccess: (_event, variables) => invalidateAgenda(queryClient, variables.leadId),
  });
}

const STATUS_SUCCESS: Record<AgendaEventStatus, string> = {
  scheduled: 'Evento reagendado',
  completed: 'Evento concluído',
  canceled: 'Evento cancelado',
  no_show: 'Não comparecimento registrado',
};

function useAgendaStatusMutation(status: Exclude<AgendaEventStatus, 'scheduled'>) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: number; leadId: number }) =>
      api.updateAgendaEvent(id, { status }),
    onSuccess: (_event, variables) => {
      invalidateAgenda(queryClient, variables.leadId);
      toast.success(STATUS_SUCCESS[status]);
    },
    onError: (error) => {
      toast.error('Não foi possível atualizar o evento', getApiErrorMessage(error));
    },
  });
}

export function useCompleteAgendaEventMutation() {
  return useAgendaStatusMutation('completed');
}

export function useCancelAgendaEventMutation() {
  return useAgendaStatusMutation('canceled');
}

export function useNoShowAgendaEventMutation() {
  return useAgendaStatusMutation('no_show');
}
